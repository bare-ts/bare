//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import * as ast from "../ast/bare-ast.js"
import type { Config } from "../core/config.js"
import { CompilerError, type Location } from "../core/compiler-error.js"
import { Lex } from "./lex.js"

export function parse(content: string, config: Config): ast.Ast {
    const p = {
        config,
        lex: new Lex(content, config.schema, { commentMark: "#" }),
    }
    const loc = p.lex.location()
    const defs: ast.AliasedType[] = []
    while (p.lex.token() !== "") {
        defs.push(parseAliased(p))
    }
    return { defs, main: config.main, loc }
}

interface Parser {
    readonly config: Config
    readonly lex: Lex
}

const ALL_CASE_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
const UPPER_SNAKE_CASE_PATTERN = /^[A-Z][A-Z0-9_]*$/
const LOWER_CAMEL_CASE_PATTERN = /^[a-z][A-Za-z0-9]*$/
const UPPER_CAMEL_CASE_PATTERN = /^[A-Z][A-Za-z0-9]*$/
const DIGIT_PATTERN = /^([0-9]+)$/

function parseAliased(p: Parser): ast.AliasedType {
    const keyword = p.lex.token()
    const loc = p.lex.location()
    if (keyword !== "enum" && keyword !== "struct" && keyword !== "type") {
        throw new CompilerError("''type' is expected.", loc)
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
    if (
        (keyword === "enum" || keyword === "struct") &&
        !p.config.legacySyntax
    ) {
        throw new CompilerError(
            `use 'type ${alias} ${keyword} { ... }' or allow '${keyword} ${alias} { ... }' with option '--legacy-syntax'.`,
            p.lex.location()
        )
    }
    const type =
        keyword === "enum"
            ? parseEnumBody(p, p.lex.location())
            : keyword === "struct"
            ? parseStructBody(p)
            : parseTypeCheckUnion(p)
    return { alias, internal: false, type, loc }
}

function parseType(p: Parser): ast.Type {
    switch (p.lex.token()) {
        case "":
            throw new CompilerError("a type is expected.", p.lex.location())
        case "[": // list (obsolete syntax)
            return parseLegacyList(p)
        case "(": // union (obsolete syntax)
            return parseLegacyUnion(p)
        case "{": // struct (obsolete syntax)
            if (!p.config.legacySyntax) {
                throw new CompilerError(
                    "use 'struct { ... } or allow '{ ... }' with option '--legacy-syntax'.",
                    p.lex.location()
                )
            }
            return parseStructBody(p)
        case "data":
            return parseData(p)
        case "enum":
            return parseEnum(p)
        case "list":
            return parseList(p)
        case "map":
            return parseMap(p)
        case "optional":
            return parseOptional(p)
        case "struct":
            return parseStruct(p)
        case "union":
            return parseUnion(p)
        default:
            return parseTypeName(p) // other type or user type name
    }
}

function parseTypeCheckUnion(p: Parser): ast.Type {
    const result = parseType(p)
    if (p.lex.token() === "|" || p.lex.token() === "=") {
        throw new CompilerError(
            "a union must be enclosed by 'union {}'.",
            p.lex.location()
        )
    }
    return result
}

function parseTypeName(p: Parser): ast.Type {
    const alias = p.lex.token()
    const loc = p.lex.location()
    p.lex.forth()
    if (alias === "void") {
        return {
            tag: "void",
            props: {
                lax: p.config.useLaxOptional,
                undef: p.config.useUndefined,
            },
            types: null,
            loc,
        }
    }
    if (ast.isBaseTag(alias) || alias === "str") {
        if (alias === "string" && !p.config.legacySyntax) {
            throw new CompilerError(
                "use 'str' or allow 'string' with option '--legacy-syntax'.",
                p.lex.location()
            )
        }
        const safeTypeName = `${alias}Safe`
        const tag =
            p.config.useSafeInt && ast.isBaseTag(safeTypeName)
                ? safeTypeName
                : alias === "str"
                ? "string"
                : alias
        return { tag, props: null, types: null, loc }
    } else if (UPPER_CAMEL_CASE_PATTERN.test(alias)) {
        return { tag: "alias", props: { alias }, types: null, loc }
    } else {
        throw new CompilerError(
            "a type name is either in UpperCamelCase or is a predefined types.",
            loc
        )
    }
}

function parseData(p: Parser): ast.Type {
    let len: ast.Integer | null
    const loc = p.lex.location()
    expect(p, "data")
    if (p.lex.token() === "<") {
        if (!p.config.legacySyntax) {
            throw new CompilerError(
                "use 'data[n]' or allow 'data<n>' with option '--legacy-syntax'.",
                p.lex.location()
            )
        }
        p.lex.forth()
        const loc = p.lex.location()
        len = { val: parseUnsignedNumber(p), loc }
        expect(p, ">")
    } else {
        len = parseOptionalLength(p)
    }
    return { tag: "data", props: { len, mut: false }, types: null, loc }
}

function parseList(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "list")
    const valType = parseTypeParameter(p)
    const len = parseOptionalLength(p)
    if (!p.config.useGenericArray && ast.isFixedNumberType(valType)) {
        return {
            tag: "typedarray",
            props: { len, mut: p.config.useMutable },
            types: [valType],
            loc,
        }
    }
    return {
        tag: "list",
        props: { len, mut: p.config.useMutable },
        types: [valType],
        loc,
    }
}

function parseLegacyList(p: Parser): ast.Type {
    if (!p.config.legacySyntax) {
        throw new CompilerError(
            "use 'list<A>[n]' or allow '[n]A' with option '--legacy-syntax'.",
            p.lex.location()
        )
    }
    let len: ast.Integer | null = null
    const loc = p.lex.location()
    expect(p, "[")
    if (p.lex.token() !== "]") {
        const loc = p.lex.location()
        len = { val: parseUnsignedNumber(p), loc }
        expect(p, "]")
    } else {
        p.lex.forth()
    }
    const valType = parseType(p)
    if (!p.config.useGenericArray && ast.isFixedNumberType(valType)) {
        return {
            tag: "typedarray",
            props: { len, mut: p.config.useMutable },
            types: [valType],
            loc,
        }
    }
    return {
        tag: "list",
        props: { len, mut: p.config.useMutable },
        types: [valType],
        loc,
    }
}

function parseOptional(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "optional")
    const type = parseTypeParameter(p)
    return {
        tag: "optional",
        props: {
            lax: p.config.useLaxOptional,
            undef: p.config.useUndefined,
        },
        types: [type],
        loc,
    }
}

function parseMap(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "map")
    let keyType: ast.Type
    let valType: ast.Type
    if (p.lex.token() === "[") {
        if (!p.config.legacySyntax) {
            throw new CompilerError(
                "use 'map<A><B>' or allow 'map[A]B' with option '--legacy-syntax'.",
                p.lex.location()
            )
        }
        p.lex.forth()
        keyType = parseType(p)
        expect(p, "]")
        valType = parseType(p)
        return {
            tag: "map",
            props: { mut: p.config.useMutable },
            types: [keyType, valType],
            loc,
        }
    } else {
        keyType = parseTypeParameter(p)
        valType = parseTypeParameter(p)
    }
    return {
        tag: "map",
        props: { mut: p.config.useMutable },
        types: [keyType, valType],
        loc,
    }
}

function parseUnion(p: Parser): ast.Type {
    expect(p, "union")
    if (p.lex.token() !== "{") {
        throw new CompilerError("'{' is expected.", p.lex.location())
    }
    const result = parseUnionBody(p)
    expect(p, "}")
    return result
}

function parseLegacyUnion(p: Parser): ast.Type {
    if (!p.config.legacySyntax) {
        throw new CompilerError(
            "use 'union { A | B } or allow '( A | B )' with option '--legacy-syntax'.",
            p.lex.location()
        )
    }
    if (p.lex.token() !== "(") {
        throw new CompilerError("'(' is expected.", p.lex.location())
    }
    const result = parseUnionBody(p)
    expect(p, ")")
    return result
}

function parseUnionBody(p: Parser): ast.Type {
    const loc = p.lex.location()
    const tags: ast.Integer[] = []
    const types: ast.Type[] = []
    let tagVal = 0
    do {
        p.lex.forth()
        if (p.lex.token() === ")" || p.lex.token() === "}") {
            if (tags.length !== 0) {
                throw new CompilerError(
                    "'|' must be followed by a type.",
                    p.lex.location()
                )
            }
            break // empty union
        }
        const type = parseType(p)
        let loc: Location | null = null
        if (p.lex.token() === "=") {
            p.lex.forth()
            loc = p.lex.location()
            tagVal = parseUnsignedNumber(p)
        } else if (p.config.pedantic) {
            throw new CompilerError(
                "in pedantic mode, all union tag must be set. '=' is expected.",
                p.lex.location()
            )
        }
        tags.push({ val: tagVal, loc })
        types.push(type)
        tagVal++
        if (p.lex.token() === "," || p.lex.token() === ";") {
            throw new CompilerError(
                "union members must be separated with '|'.",
                p.lex.location()
            )
        }
    } while (p.lex.token() === "|")
    const flat = p.config.useFlatUnion
    return { tag: "union", props: { flat, tags }, types, loc }
}

function parseEnum(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "enum")
    const result = parseEnumBody(p, loc)
    return result
}

function parseEnumBody(p: Parser, loc: Location): ast.Type {
    expect(p, "{")
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
        names.add(name)
        const valLoc = p.lex.location()
        p.lex.forth()
        if (p.lex.token() === "=") {
            p.lex.forth()
            val = parseUnsignedNumber(p)
        } else if (p.config.pedantic) {
            throw new CompilerError(
                "in pedantic mode, all enum tag must be set. '=' is expected.",
                p.lex.location()
            )
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
    expect(p, "}")
    const intEnum = p.config.useIntEnum
    return { tag: "enum", props: { intEnum, vals }, types: null, loc }
}

function parseStruct(p: Parser): ast.Type {
    expect(p, "struct")
    return parseStructBody(p)
}

function parseStructBody(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "{")
    const mut = p.config.useMutable
    const quoted = p.config.useQuotedProperty
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
        names.add(name)
        const fieldLoc = p.lex.location()
        p.lex.forth()
        expect(p, ":")
        const type = parseTypeCheckUnion(p)
        if (p.lex.token() === "," || p.lex.token() === ";") {
            throw new CompilerError(
                `fields cannot be separated by '${p.lex.token()}'.`,
                p.lex.location()
            )
        }
        fields.push({ mut, name, quoted, loc: fieldLoc })
        types.push(type)
    }
    expect(p, "}")
    return {
        tag: "struct",
        props: { class: p.config.useClass, fields },
        types,
        loc,
    }
}

function parseOptionalLength(p: Parser): ast.Integer | null {
    if (p.lex.token() === "[") {
        p.lex.forth()
        const loc = p.lex.location()
        const val = parseUnsignedNumber(p)
        expect(p, "]")
        return { val, loc }
    } else {
        return null
    }
}

function parseTypeParameter(p: Parser): ast.Type {
    expect(p, "<")
    const result = parseType(p)
    if (p.lex.token() === "," || p.lex.token() === ";") {
        throw new CompilerError(
            "every type must be enclosed with '<>'. e.g. 'map<Key><Val>'.",
            p.lex.location()
        )
    }
    expect(p, ">")
    return result
}

function parseUnsignedNumber(p: Parser): number {
    const result = Number.parseInt(p.lex.token(), 10)
    if (!DIGIT_PATTERN.test(p.lex.token())) {
        throw new CompilerError(
            "an unsigned integer is expected.",
            p.lex.location()
        )
    }
    p.lex.forth()
    return result
}

function expect(p: Parser, token: string): void {
    if (p.lex.token() !== token) {
        throw new CompilerError(`'${token}' is expected.`, p.lex.location())
    }
    p.lex.forth()
}
