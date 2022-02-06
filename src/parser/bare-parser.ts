import * as ast from "../ast/bare-ast.js"
import type { Config } from "../core/config.js"
import { CompilerError } from "../core/compiler-error.js"
import { Lex } from "./lex.js"

export function parse(content: string, config: Config): ast.Ast {
    const p = {
        config,
        lex: new Lex(content, config.schema, { commentMark: "#" }),
    }
    const startLocation = p.lex.location()
    const result: Map<string, ast.AliasedType> = new Map()
    while (p.lex.token() !== "") {
        const location = p.lex.location()
        const aliased = parseAliased(p)
        if (result.has(aliased.alias)) {
            throw new CompilerError(
                `alias '${aliased.alias}' is already used.`,
                location
            )
        }
        result.set(aliased.alias, aliased)
    }
    if (result.size === 0) {
        throw new CompilerError("a schema cannot be empty.", p.lex.location())
    }
    return { defs: Array.from(result.values()), loc: startLocation }
}

interface Parser {
    readonly config: Config
    readonly lex: Lex
}

const ALL_CASE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9_]*$/
const LOWER_CAMEL_CASE_PATTERN = /^[a-z][A-Za-z0-9]*$/
const UPPER_CAMEL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/
const DIGIT_PATTERN = /^(0|[1-9][0-9]*)$/

function parseAliased(p: Parser): ast.AliasedType {
    const keyword = p.lex.token()
    const loc = p.lex.location()
    if (keyword !== "enum" && keyword !== "struct" && keyword !== "type") {
        throw new CompilerError("'enum', 'struct', or 'type' is expected.", loc)
    }
    p.lex.forth()
    const alias = p.lex.token()
    if (!UPPER_CAMEL_CASE_PATTERN.test(alias)) {
        throw new CompilerError(
            `the type name '${alias}' must be in UpperCamelCase.`,
            p.lex.location()
        )
    }
    p.lex.forth()
    if (p.lex.token() === "=") {
        throw new CompilerError(
            "a type definition and its body cannot be separated by '='.",
            p.lex.location()
        )
    }
    const type =
        keyword === "enum"
            ? parseEnumBody(p)
            : keyword === "struct"
            ? parseStructBody(p)
            : parseTypeCheckUnion(p)
    if (
        keyword === "type" &&
        type.tag === "alias" &&
        alias === type.props.alias
    ) {
        throw new CompilerError("a type cannot alias itself.", p.lex.location())
    }
    return { alias, exported: true, type, loc }
}

function parseType(p: Parser): ast.Type {
    switch (p.lex.token()) {
        case "":
            throw new CompilerError("a type is expected.", p.lex.location())
        case "[": // array
            return parseArray(p)
        case "(": // union
            return parseUnion(p)
        case "{": // DEPRECATED: anonymous struct (backward compatibility)
            return parseStructBody(p)
        case "data":
            return parseData(p)
        case "optional":
            return parseOptional(p)
        case "map":
            return parseMap(p)
        default:
            return parseTypeName(p) // other type or user type name
    }
}

function parseTypeCheckUnion(p: Parser): ast.Type {
    const result = parseType(p)
    if (p.lex.token() === "|" || p.lex.token() === "=") {
        throw new CompilerError(
            "a union must be enclosed by '()'.",
            p.lex.location()
        )
    }
    return result
}

function parseTypeName(p: Parser): ast.Type {
    const alias = p.lex.token()
    const loc = p.lex.location()
    if (!ast.isPrimitiveTag(alias) && !UPPER_CAMEL_CASE_PATTERN.test(alias)) {
        throw new CompilerError(
            "a type name is either in UpperCamelCase or is a predefined types.",
            loc
        )
    }
    p.lex.forth()
    if (ast.isPrimitiveTag(alias)) {
        const safeTypeName = `${alias}Safe`
        const tag =
            p.config.useSafeInt && ast.isPrimitiveTag(safeTypeName)
                ? safeTypeName
                : alias
        return { tag, props: null, types: null, loc }
    }
    return { tag: "alias", props: { alias }, types: null, loc }
}

function parseData(p: Parser): ast.Type {
    if (p.lex.token() !== "data") {
        throw new CompilerError("'data' is expected.", p.lex.location())
    }
    let len: number | null = null
    const loc = p.lex.location()
    p.lex.forth()
    if (p.lex.token() === "<") {
        p.lex.forth()
        len = parseLength(p)
        p.lex.forth()
        if (p.lex.token() !== ">") {
            throw new CompilerError("'>' is expected.", p.lex.location())
        }
        p.lex.forth()
    }
    return { tag: "data", props: { len, mut: false }, types: null, loc }
}

function parseArray(p: Parser): ast.Type {
    if (p.lex.token() !== "[") {
        throw new CompilerError("'[' is expected.", p.lex.location())
    }
    let len: number | null = null
    const loc = p.lex.location()
    p.lex.forth()
    if (p.lex.token() !== "]") {
        len = parseLength(p)
        p.lex.forth()
        if (p.lex.token() !== "]") {
            throw new CompilerError("']' is expected.", p.lex.location())
        }
    }
    p.lex.forth()
    const valType = parseType(p)
    if (!p.config.useGenericArray && ast.isTypedArrayValType(valType.tag)) {
        return {
            tag: "typedarray",
            props: { len, valType: valType.tag },
            types: null,
            loc,
        }
    }
    return {
        tag: "array",
        props: { len, mut: p.config.useMutable },
        types: [valType],
        loc,
    }
}

function parseOptional(p: Parser): ast.Type {
    if (p.lex.token() !== "optional") {
        throw new CompilerError("'optional' is expected.", p.lex.location())
    }
    const loc = p.lex.location()
    p.lex.forth()
    if (p.lex.token() !== "<") {
        throw new CompilerError("'<' is expected.", p.lex.location())
    }
    p.lex.forth()
    const type = parseType(p)
    if (p.lex.token() !== ">") {
        throw new CompilerError("'>' is expected.", p.lex.location())
    }
    p.lex.forth()
    return {
        tag: "optional",
        props: {
            lax: p.config.useLaxOptional,
            null: p.config.useNull,
        },
        types: [type],
        loc,
    }
}

function parseMap(p: Parser): ast.Type {
    if (p.lex.token() !== "map") {
        throw new CompilerError("'map' is expected.", p.lex.location())
    }
    const loc = p.lex.location()
    p.lex.forth()
    if (p.lex.token() !== "[") {
        throw new CompilerError("'[' is expected.", p.lex.location())
    }
    p.lex.forth()
    const keyType = parseType(p)
    if (!ast.isPrimitiveTag(keyType.tag) || keyType.tag === "void") {
        throw new CompilerError(
            "the type of keys must be among: bool, f32, f64, i8, i16, i32, i64, int, string, u8, u16, u32, u64, uint.",
            p.lex.location()
        )
    }
    if (p.lex.token() !== "]") {
        throw new CompilerError("']' is expected.", p.lex.location())
    }
    p.lex.forth()
    const valType = parseType(p)
    return {
        tag: "map",
        props: { mut: p.config.useMutable },
        types: [keyType, valType],
        loc,
    }
}

function parseUnion(p: Parser): ast.Type {
    if (p.lex.token() !== "(") {
        throw new CompilerError("'(' is expected.", p.lex.location())
    }
    const loc = p.lex.location()
    const tags: number[] = []
    const types: ast.Type[] = []
    const stringifiedUnits = new Set()
    let tagVal = 0
    do {
        p.lex.forth()
        if (p.lex.token() === ")") {
            if (tags.length === 0) {
                throw new CompilerError(
                    "a union must include at least one type.",
                    p.lex.location()
                )
            } else {
                throw new CompilerError(
                    "'|' must be followed by a type.",
                    p.lex.location()
                )
            }
        }
        const type = parseType(p)
        const stringifiedType = JSON.stringify(type)
        // NOTE: this dirty check is ok because we initialize
        // every object in the same way (properties are sorted)
        if (stringifiedUnits.has(stringifiedType)) {
            throw new CompilerError(
                "a type cannot be repeated in an union.",
                p.lex.location()
            )
        }
        stringifiedUnits.add(stringifiedType)
        if (p.lex.token() === "=") {
            p.lex.forth()
            const prevTagVal = tagVal - 1
            tagVal = parseU64Safe(p)
            if (prevTagVal !== -1 && prevTagVal >= tagVal) {
                throw new CompilerError(
                    "a union tag must be greater than the previous one.",
                    p.lex.location()
                )
            }
            p.lex.forth()
        }
        tags.push(tagVal)
        types.push(type)
        tagVal++
    } while (p.lex.token() === "|")
    if (p.lex.token() !== ")") {
        throw new CompilerError("')' is expected.", p.lex.location())
    }
    p.lex.forth()
    const flat = p.config.useFlatUnion
    return { tag: "union", props: { flat, tags }, types, loc }
}

function parseEnumBody(p: Parser): ast.Type {
    if (p.lex.token() !== "{") {
        throw new CompilerError("'{' is expected.", p.lex.location())
    }
    const loc = p.lex.location()
    p.lex.forth()
    const vals: ast.EnumVal[] = []
    const names = new Set()
    let val = 0
    while (ALL_CASE_PATTERN.test(p.lex.token())) {
        const name = p.lex.token()
        if (!UPPER_SNAKE_CASE_PATTERN.test(name)) {
            throw new CompilerError(
                "the name of an enum member must be in UPPER_SNAKE_CASE.",
                p.lex.location()
            )
        }
        if (names.has(name)) {
            throw new CompilerError(
                "the name of an enum member must be unique.",
                p.lex.location()
            )
        }
        names.add(name)
        const valLoc = p.lex.location()
        p.lex.forth()
        if (p.lex.token() === "=") {
            p.lex.forth()
            const prevVal = val - 1
            val = parseU64Safe(p)
            if (prevVal !== -1 && prevVal >= val) {
                throw new CompilerError(
                    "a enum tag must be greater than the previous one.",
                    p.lex.location()
                )
            }
            p.lex.forth()
        }
        vals.push({ name, val, loc: valLoc })
        val++
        if (p.lex.token() === "," || p.lex.token() === ";") {
            throw new CompilerError(
                `enum members cannot be separated by '${p.lex.token()}'.`,
                p.lex.location()
            )
        }
    }
    if (p.lex.token() !== "}") {
        throw new CompilerError("'}' is expected.", p.lex.location())
    }
    if (vals.length === 0) {
        throw new CompilerError(
            "an enum must include at least one member.",
            p.lex.location()
        )
    }
    p.lex.forth()
    const intEnum = p.config.useIntEnum
    return { tag: "enum", props: { intEnum, vals }, types: null, loc }
}

function parseStructBody(p: Parser): ast.Type {
    if (p.lex.token() !== "{") {
        throw new CompilerError("'{' is expected.", p.lex.location())
    }
    const loc = p.lex.location()
    p.lex.forth()
    const fields: ast.StructField[] = []
    const types: ast.Type[] = []
    const names = new Set()
    while (ALL_CASE_PATTERN.test(p.lex.token())) {
        const name = p.lex.token()
        if (!LOWER_CAMEL_CASE_PATTERN.test(name)) {
            throw new CompilerError(
                "the name of a field must be in lowerCamelCase.",
                p.lex.location()
            )
        }
        if (names.has(name)) {
            throw new CompilerError(
                "the name of a field must be unique.",
                p.lex.location()
            )
        }
        names.add(name)
        const fieldLoc = p.lex.location()
        p.lex.forth()
        if (p.lex.token() !== ":") {
            throw new CompilerError("':' is expected.", p.lex.location())
        }
        p.lex.forth()
        const type = parseTypeCheckUnion(p)
        if (p.lex.token() === "," || p.lex.token() === ";") {
            throw new CompilerError(
                `fields cannot be separated by '${p.lex.token()}'.`,
                p.lex.location()
            )
        }
        fields.push({ mut: p.config.useMutable, name, loc: fieldLoc })
        types.push(type)
    }
    if (p.lex.token() !== "}") {
        throw new CompilerError("'}' is expected.", p.lex.location())
    }
    if (fields.length === 0) {
        throw new CompilerError(
            "a struct must include at least one member.",
            p.lex.location()
        )
    }
    p.lex.forth()
    return {
        tag: "struct",
        props: { class: p.config.useClass, fields },
        types,
        loc,
    }
}

function parseLength(p: Parser): number {
    const result = Number.parseInt(p.lex.token(), 10)
    if (
        !DIGIT_PATTERN.test(p.lex.token()) ||
        result === 0 ||
        result >>> 0 !== result
    ) {
        throw new CompilerError("a non-zero u32 is expected.", p.lex.location())
    }
    return result
}

function parseU64Safe(p: Parser): number {
    const result = Number.parseInt(p.lex.token(), 10)
    if (!DIGIT_PATTERN.test(p.lex.token()) || !Number.isSafeInteger(result)) {
        throw new CompilerError(
            "a non-negative safe integer is expected.",
            p.lex.location()
        )
    }
    return result
}
