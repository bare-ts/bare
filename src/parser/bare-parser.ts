import type {
    AliasedBareType,
    BareAst,
    BareType,
    EnumVal,
    StructField,
    UnionUnit,
} from "../ast/bare-ast.js"
import * as BareAst_ from "../ast/bare-ast.js"
import { BareParserConfig } from "./bare-parser-config.js"
import { BareParserError } from "./bare-parser-error.js"
import { Lex } from "./lex.js"
import assert from "assert"

interface BareParser {
    readonly config: BareParserConfig
    readonly lex: Lex
}

function BareParser(
    lex: Lex,
    partConfig: Partial<BareParserConfig> = {}
): BareParser {
    const config = BareParserConfig(partConfig)
    return { config, lex }
}

const ALL_CASE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9_]*$/
const LOWER_CAMEL_CASE_PATTERN = /^[a-z][A-Za-z0-9]*$/
const UPPER_CAMEL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/
const DIGIT_PATTERN = /^(0|[1-9][0-9]*)$/

export function parse(
    content: string,
    filename: string,
    partConfig: Partial<BareParserConfig>
): BareAst {
    const p = {
        config: BareParserConfig(partConfig),
        lex: new Lex(content, filename, { commentMark: "#" }),
    }
    const result: Map<string, AliasedBareType> = new Map()
    while (p.lex.token() !== "") {
        const location = p.lex.location()
        const aliased = parseAliased(p)
        if (result.has(aliased.alias)) {
            throw new BareParserError(
                `Alias '${aliased.alias}' is already used.`,
                location
            )
        }
        result.set(aliased.alias, aliased)
    }
    if (result.size === 0) {
        throw new BareParserError("A schema cannot be empty.", p.lex.location())
    }
    return Array.from(result.values())
}

function parseAliased(p: BareParser): AliasedBareType {
    const keyword = p.lex.token()
    if (keyword !== "enum" && keyword !== "struct" && keyword !== "type") {
        throw new BareParserError(
            "'enum', 'struct', or 'type' is expected.",
            p.lex.location()
        )
    }
    p.lex.forth()
    const alias = p.lex.token()
    if (!UPPER_CAMEL_CASE_PATTERN.test(alias)) {
        throw new BareParserError(
            `The type name '${alias}' must be in UpperCamelCase.`,
            p.lex.location()
        )
    }
    p.lex.forth()
    if (p.lex.token() === "=") {
        throw new BareParserError(
            "A type definition and its body cannot be separated by '='.",
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
        throw new BareParserError(
            "A type cannot alias itself.",
            p.lex.location()
        )
    }
    return { alias, exported: true, type }
}

function parseType(p: BareParser): BareType {
    switch (p.lex.token()) {
        case "":
            throw new BareParserError("A type is expected.", p.lex.location())
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

function parseTypeCheckUnion(p: BareParser): BareType {
    const result = parseType(p)
    if (p.lex.token() === "|" || p.lex.token() === "=") {
        throw new BareParserError(
            "A union must be enclosed by '()'.",
            p.lex.location()
        )
    }
    return result
}

function parseTypeName(p: BareParser): BareType {
    const alias = p.lex.token()
    if (
        !BareAst_.isPropertylessTag(alias) &&
        !UPPER_CAMEL_CASE_PATTERN.test(alias)
    ) {
        throw new BareParserError(
            "A type name is either in UpperCamelCase or is a predefined types.",
            p.lex.location()
        )
    }
    p.lex.forth()
    if (BareAst_.isPropertylessTag(alias)) {
        if (
            p.config.useSafeInt &&
            (alias === "i64" ||
                alias === "int" ||
                alias === "u64" ||
                alias === "uint")
        ) {
            const safeTypeName = `${alias}Safe` as const
            return { tag: safeTypeName, props: {} }
        }
        return { tag: alias, props: {} }
    }
    return { tag: "alias", props: { alias } }
}

function parseData(p: BareParser): BareType {
    assert(p.lex.token() === "data", "'data' is expected.")
    let len: number | null = null
    p.lex.forth()
    if (p.lex.token() === "<") {
        p.lex.forth()
        len = parseU32(p)
        p.lex.forth()
        if (p.lex.token() !== ">") {
            throw new BareParserError("'>' is expected.", p.lex.location())
        }
        p.lex.forth()
    }
    return { tag: "data", props: { len } }
}

function parseArray(p: BareParser): BareType {
    assert(p.lex.token() === "[", "'[' is expected.")
    let len: number | null = null
    p.lex.forth()
    if (p.lex.token() !== "]") {
        len = parseU32(p)
        p.lex.forth()
        if (p.lex.token() !== "]") {
            throw new BareParserError("']' is expected.", p.lex.location())
        }
    }
    p.lex.forth()
    const valType = parseType(p)
    if (
        !p.config.useGenericArray &&
        BareAst_.isTypedArrayValType(valType.tag)
    ) {
        return { tag: "typedArray", props: { len, valTypeName: valType.tag } }
    }
    return {
        tag: "array",
        props: { len, mutable: p.config.useMutable, valType },
    }
}

function parseOptional(p: BareParser): BareType {
    assert(p.lex.token() === "optional", "'optional' is expected.")
    p.lex.forth()
    if (p.lex.token() !== "<") {
        throw new BareParserError("'<' is expected.", p.lex.location())
    }
    p.lex.forth()
    const type = parseType(p)
    if (p.lex.token() !== ">") {
        throw new BareParserError("'>' is expected.", p.lex.location())
    }
    p.lex.forth()
    return {
        tag: "optional",
        props: {
            permissive: p.config.useLaxOptional,
            null: p.config.useNull,
            type,
        },
    }
}

function parseMap(p: BareParser): BareType {
    assert(p.lex.token() === "map", "'map' is expected.")
    p.lex.forth()
    if (p.lex.token() !== "[") {
        throw new BareParserError("'[' is expected.", p.lex.location())
    }
    p.lex.forth()
    const keyType = parseType(p)
    if (!BareAst_.isPropertylessTag(keyType.tag) || keyType.tag === "void") {
        throw new BareParserError(
            "The type of keys must be among: bool, f32, f64, i8, i16, i32, i64, int, string, u8, u16, u32, u64, uint.",
            p.lex.location()
        )
    }
    if (p.lex.token() !== "]") {
        throw new BareParserError("']' is expected.", p.lex.location())
    }
    p.lex.forth()
    const valType = parseType(p)
    return {
        tag: "map",
        props: { keyType, mutable: p.config.useMutable, valType },
    }
}

function parseUnion(p: BareParser): BareType {
    assert(p.lex.token() === "(", "'(' is expected.")
    const units: UnionUnit[] = []
    const stringifiedUnits = new Set()
    let tagVal = 0
    do {
        p.lex.forth()
        if (p.lex.token() === ")") {
            if (units.length === 0) {
                throw new BareParserError(
                    "A union must include at least one type.",
                    p.lex.location()
                )
            } else {
                throw new BareParserError(
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
            throw new BareParserError(
                "A type cannot be repeated in an union.",
                p.lex.location()
            )
        }
        stringifiedUnits.add(stringifiedType)
        if (p.lex.token() === "=") {
            p.lex.forth()
            const prevTagVal = tagVal - 1
            tagVal = parseU64Safe(p)
            if (prevTagVal !== -1 && prevTagVal >= tagVal) {
                throw new BareParserError(
                    "A union tag must be greater than the previous one.",
                    p.lex.location()
                )
            }
            p.lex.forth()
        }
        units.push({ tagVal, type })
        tagVal++
    } while (p.lex.token() === "|")
    if (p.lex.token() !== ")") {
        throw new BareParserError("')' is expected.", p.lex.location())
    }
    p.lex.forth()
    return { tag: "union", props: { flat: p.config.useFlatUnion, units } }
}

function parseEnumBody(p: BareParser): BareType {
    if (p.lex.token() !== "{") {
        throw new BareParserError("'{' is expected.", p.lex.location())
    }
    p.lex.forth()
    const vals: EnumVal[] = []
    const names = new Set()
    let val = 0
    while (ALL_CASE_PATTERN.test(p.lex.token())) {
        const name = p.lex.token()
        if (!UPPER_SNAKE_CASE_PATTERN.test(name)) {
            throw new BareParserError(
                "The name of an enum member must be in UPPER_SNAKE_CASE.",
                p.lex.location()
            )
        }
        if (names.has(name)) {
            throw new BareParserError(
                "The name of an enum member must be unique.",
                p.lex.location()
            )
        }
        names.add(name)
        p.lex.forth()
        if (p.lex.token() === "=") {
            p.lex.forth()
            const prevVal = val - 1
            val = parseU64Safe(p)
            if (prevVal !== -1 && prevVal >= val) {
                throw new BareParserError(
                    "A enum tag must be greater than the previous one.",
                    p.lex.location()
                )
            }
            p.lex.forth()
        }
        vals.push({ name, val })
        val++
        if (p.lex.token() === "," || p.lex.token() === ";") {
            throw new BareParserError(
                `Enum members cannot be separated by '${p.lex.token()}'.`,
                p.lex.location()
            )
        }
    }
    if (p.lex.token() !== "}") {
        throw new BareParserError("'}' is expected.", p.lex.location())
    }
    if (vals.length === 0) {
        throw new BareParserError(
            "An enum must include at least one member.",
            p.lex.location()
        )
    }
    p.lex.forth()
    return { tag: "enum", props: { useName: !p.config.useIntEnum, vals } }
}

function parseStructBody(p: BareParser): BareType {
    if (p.lex.token() !== "{") {
        throw new BareParserError("'{' is expected.", p.lex.location())
    }
    p.lex.forth()
    const fields: StructField[] = []
    const names = new Set()
    while (ALL_CASE_PATTERN.test(p.lex.token())) {
        const name = p.lex.token()
        if (!LOWER_CAMEL_CASE_PATTERN.test(name)) {
            throw new BareParserError(
                "The name of a field must be in lowerCamelCase.",
                p.lex.location()
            )
        }
        if (names.has(name)) {
            throw new BareParserError(
                "The name of a field must be unique.",
                p.lex.location()
            )
        }
        names.add(name)
        p.lex.forth()
        if (p.lex.token() !== ":") {
            throw new BareParserError("':' is expected.", p.lex.location())
        }
        p.lex.forth()
        const type = parseTypeCheckUnion(p)
        fields.push({ mutable: p.config.useMutable, name, type })
        if (p.lex.token() === "," || p.lex.token() === ";") {
            throw new BareParserError(
                `Fields cannot be separated by '${p.lex.token()}'.`,
                p.lex.location()
            )
        }
    }
    if (p.lex.token() !== "}") {
        throw new BareParserError("'}' is expected.", p.lex.location())
    }
    if (fields.length === 0) {
        throw new BareParserError(
            "A struct must include at least one member.",
            p.lex.location()
        )
    }
    p.lex.forth()
    return { tag: "struct", props: { class: p.config.useClass, fields } }
}

function parseU32(p: BareParser): number {
    const result = Number.parseInt(p.lex.token(), 10)
    if (
        !DIGIT_PATTERN.test(p.lex.token()) ||
        result === 0 ||
        result >>> 0 !== result
    ) {
        throw new BareParserError(
            "A non-zero u32 is expected.",
            p.lex.location()
        )
    }
    return result
}

function parseU64Safe(p: BareParser): number {
    const result = Number.parseInt(p.lex.token(), 10)
    if (!DIGIT_PATTERN.test(p.lex.token()) || !Number.isSafeInteger(result)) {
        throw new BareParserError(
            "A non-negative safe integer is expected.",
            p.lex.location()
        )
    }
    return result
}
