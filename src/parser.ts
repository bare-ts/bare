//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as ast from "./ast.ts"
import { CompilerError, type Config } from "./core.ts"
import * as lexer from "./lexer.ts"
import {
    ALL_CASE_RE,
    CONSTANT_CASE_RE,
    toPascalCase,
} from "./utils/formatting.ts"

export function parse(content: string, config: Config): ast.Ast {
    const p: Parser = { config, lex: lexer.create(content) }
    const offset = p.lex.offset
    const defs: ast.AliasedType[] = []
    while (p.lex.token !== "") {
        defs.push(parseAliased(p))
    }
    return { defs, filename: config.schema, offset }
}

type Parser = {
    readonly config: Config
    readonly lex: lexer.Lexer
}

function parseAliased(p: Parser): ast.AliasedType {
    const comment = p.lex.comment
    const keyword = p.lex.token
    const offset = p.lex.offset
    if (keyword !== "enum" && keyword !== "struct" && keyword !== "type") {
        throw new CompilerError("'type' is expected.", offset)
    }
    eatToken(p)
    const alias = p.lex.token
    eatToken(p)
    if (p.lex.token === "=") {
        throw new CompilerError(
            "a type definition and its body cannot be separated by '='.",
            p.lex.offset,
        )
    }
    if ((keyword === "enum" || keyword === "struct") && !p.config.legacy) {
        throw new CompilerError(
            `use 'type ${alias} ${keyword} { ... }' or allow '${keyword} ${alias} { ... }' with option '--legacy'.`,
            p.lex.offset,
        )
    }
    const type =
        keyword === "enum"
            ? parseEnumBody(p, p.lex.offset)
            : keyword === "struct"
              ? parseStructBody(p)
              : parseTypeCheckUnion(p)
    checkSeparator(p)
    return { alias, internal: false, comment, type, offset }
}

function parseType(p: Parser): ast.Type {
    switch (p.lex.token) {
        case "":
            throw new CompilerError("a type is expected.", p.lex.offset)
        case "[": // list (obsolete syntax)
            return parseLegacyList(p)
        case "(": // union (obsolete syntax)
            return parseLegacyUnion(p)
        case "{": {
            // struct (obsolete syntax)
            if (!p.config.legacy) {
                throw new CompilerError(
                    "use 'struct { ... } or allow '{ ... }' with option '--legacy'.",
                    p.lex.offset,
                )
            }
            return parseStructBody(p)
        }
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
    if (p.lex.token === "|" || p.lex.token === "=") {
        throw new CompilerError(
            "a union must be enclosed by 'union {}'.",
            p.lex.offset,
        )
    }
    return result
}

function parseTypeName(p: Parser): ast.Type {
    const alias = p.lex.token
    const offset = p.lex.offset
    eatToken(p)
    if (alias === "string" && !p.config.legacy) {
        throw new CompilerError(
            "use 'str' or allow 'string' with option '--legacy'.",
            offset,
        )
    }
    const tag = alias === "string" ? "str" : alias
    if (ast.isBaseTag(tag) || tag === "void") {
        return { tag, data: null, types: null, extra: null, offset }
    }
    return { tag: "alias", data: alias, types: null, extra: null, offset }
}

function parseData(p: Parser): ast.Type {
    let len: ast.Length | null
    const offset = p.lex.offset
    expect(p, "data")
    if (p.lex.token === "<") {
        if (!p.config.legacy) {
            throw new CompilerError(
                "use 'data[n]' or allow 'data<n>' with option '--legacy'.",
                p.lex.offset,
            )
        }
        eatToken(p)
        const offset = p.lex.offset
        len = {
            name: null,
            val: parseUnsignedNumber(p),
            comment: null,
            extra: null,
            offset,
        }
        expect(p, ">")
    } else {
        len = parseOptionalLength(p)
    }
    return { tag: "data", data: len, types: null, extra: null, offset }
}

function parseList(p: Parser): ast.Type {
    const offset = p.lex.offset
    expect(p, "list")
    const valType = parseTypeParameter(p)
    const len = parseOptionalLength(p)
    return {
        tag: "list",
        data: len,
        types: [valType],
        extra: null,
        offset,
    }
}

function parseLegacyList(p: Parser): ast.Type {
    if (!p.config.legacy) {
        throw new CompilerError(
            "use 'list<A>[n]' or allow '[n]A' with option '--legacy'.",
            p.lex.offset,
        )
    }
    let len: ast.Length | null = null
    const offset = p.lex.offset
    expect(p, "[")
    if (p.lex.token !== "]") {
        const offset = p.lex.offset
        len = {
            name: null,
            val: parseUnsignedNumber(p),
            comment: null,
            extra: null,
            offset,
        }
        expect(p, "]")
    } else {
        eatToken(p)
    }
    return {
        tag: "list",
        data: len,
        types: [parseType(p)],
        extra: null,
        offset,
    }
}

function parseOptional(p: Parser): ast.Type {
    const offset = p.lex.offset
    expect(p, "optional")
    return {
        tag: "optional",
        data: null,
        types: [parseTypeParameter(p)],
        extra: null,
        offset,
    }
}

function parseMap(p: Parser): ast.Type {
    const offset = p.lex.offset
    expect(p, "map")
    let keyType: ast.Type
    let valType: ast.Type
    if (p.lex.token === "[") {
        if (!p.config.legacy) {
            throw new CompilerError(
                "use 'map<A><B>' or allow 'map[A]B' with option '--legacy'.",
                p.lex.offset,
            )
        }
        eatToken(p)
        keyType = parseType(p)
        expect(p, "]")
        valType = parseType(p)
    } else {
        keyType = parseTypeParameter(p)
        valType = parseTypeParameter(p)
    }
    return {
        tag: "map",
        data: null,
        types: [keyType, valType],
        extra: null,
        offset,
    }
}

function parseUnion(p: Parser): ast.Type {
    const offset = p.lex.offset
    expect(p, "union")
    expect(p, "{")
    const result = parseUnionBody(p, offset)
    expect(p, "}")
    return result
}

function parseLegacyUnion(p: Parser): ast.Type {
    if (!p.config.legacy) {
        throw new CompilerError(
            "use 'union { A | B } or allow '( A | B )' with option '--legacy'.",
            p.lex.offset,
        )
    }
    const offset = p.lex.offset
    expect(p, "(")
    const result = parseUnionBody(p, offset)
    expect(p, ")")
    return result
}

function parseUnionBody(p: Parser, offset: number): ast.Type {
    const tags: ast.UnionTag[] = []
    const types: ast.Type[] = []
    let tagVal = 0
    do {
        let comment = p.lex.comment
        if (p.lex.token === "|") {
            eatToken(p)
            if (p.lex.comment !== "") {
                comment = p.lex.comment
            }
        }
        if (p.lex.token === ")" || p.lex.token === "}") {
            break
        }
        const type = parseType(p)
        let offset: number = p.lex.offset
        if (p.lex.token === "=") {
            eatToken(p)
            offset = p.lex.offset
            tagVal = parseUnsignedNumber(p)
        } else if (p.config.pedantic) {
            throw new CompilerError(
                "in pedantic mode, all union tags must be set. '=' is expected.",
                p.lex.offset,
            )
        }
        tags.push({
            name: null,
            val: tagVal,
            comment,
            extra: null,
            offset,
        })
        types.push(type)
        tagVal++
        if (p.lex.token === "," || p.lex.token === ";") {
            throw new CompilerError(
                "union members must be separated with '|'.",
                p.lex.offset,
            )
        }
    } while (p.lex.token === "|")
    return { tag: "union", data: tags, types, extra: null, offset }
}

function parseEnum(p: Parser): ast.Type {
    const offset = p.lex.offset
    expect(p, "enum")
    const result = parseEnumBody(p, offset)
    return result
}

function parseEnumBody(p: Parser, offset: number): ast.Type {
    expect(p, "{")
    const vals: ast.EnumVal[] = []
    let val = 0
    while (ALL_CASE_RE.test(p.lex.token)) {
        const comment = p.lex.comment
        let name = p.lex.token
        if (!CONSTANT_CASE_RE.test(name)) {
            throw new CompilerError(
                "the name of an enum member must be in CONSTANT_CASE.",
                p.lex.offset,
            )
        }
        const valLoc = p.lex.offset
        eatToken(p)
        if (p.lex.token === "=") {
            eatToken(p)
            val = parseUnsignedNumber(p)
        } else if (p.config.pedantic) {
            throw new CompilerError(
                "in pedantic mode, all enum tags must be set. '=' is expected.",
                p.lex.offset,
            )
        }
        name = toPascalCase(name)
        vals.push({ name, val, comment, extra: null, offset: valLoc })
        val++
        checkSeparator(p)
    }
    expect(p, "}")
    return { tag: "enum", data: vals, types: null, extra: null, offset }
}

function parseStruct(p: Parser): ast.Type {
    expect(p, "struct")
    return parseStructBody(p)
}

function parseStructBody(p: Parser): ast.Type {
    const offset = p.lex.offset
    expect(p, "{")
    const fields: ast.StructField[] = []
    const types: ast.Type[] = []
    while (ALL_CASE_RE.test(p.lex.token)) {
        const comment = p.lex.comment
        const name = p.lex.token
        const offset = p.lex.offset
        eatToken(p)
        expect(p, ":")
        const type = parseTypeCheckUnion(p)
        checkSeparator(p)
        fields.push({ name, val: null, comment, extra: null, offset })
        types.push(type)
    }
    expect(p, "}")
    return { tag: "struct", data: fields, types, extra: null, offset }
}

function parseOptionalLength(p: Parser): ast.Length | null {
    if (p.lex.token === "[") {
        eatToken(p)
        const offset = p.lex.offset
        const val = parseUnsignedNumber(p)
        expect(p, "]")
        return { name: null, val, comment: null, extra: null, offset }
    }
    return null
}

function parseTypeParameter(p: Parser): ast.Type {
    expect(p, "<")
    const result = parseType(p)
    if (p.lex.token === "," || p.lex.token === ";") {
        throw new CompilerError(
            "every type must be enclosed with '<>'. e.g. 'map<Key><Val>'.",
            p.lex.offset,
        )
    }
    expect(p, ">")
    return result
}

function checkSeparator(p: Parser): void {
    if (p.lex.token === "," || p.lex.token === ";") {
        throw new CompilerError(
            `members cannot be separated by '${p.lex.token}'.`,
            p.lex.offset,
        )
    }
}

function parseUnsignedNumber(p: Parser): number {
    const token = p.lex.token
    if (!/^\d+$/.test(token)) {
        throw new CompilerError(
            "an unsigned integer is expected.",
            p.lex.offset,
        )
    }
    eatToken(p)
    return Number.parseInt(token, 10)
}

function expect(p: Parser, token: string): void {
    if (p.lex.token !== token) {
        throw new CompilerError(`'${token}' is expected.`, p.lex.offset)
    }
    eatToken(p)
}

function eatToken(p: Parser): void {
    lexer.nextToken(p.lex)
}
