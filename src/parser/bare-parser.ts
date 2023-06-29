//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as ast from "../ast/bare-ast.js"
import { CompilerError, type Location } from "../core/compiler-error.js"
import type { Config } from "../core/config.js"
import {
    ALL_CASE_RE,
    CONSTANT_CASE_RE,
    toPascalCase,
} from "../utils/formatting.js"
import { Lex } from "./bare-lex.js"

export function parse(content: string, config: Config): ast.Ast {
    const p = {
        config,
        lex: new Lex(content, config.schema),
    }
    const loc = p.lex.location()
    const defs: ast.AliasedType[] = []
    while (p.lex.token !== "") {
        defs.push(parseAliased(p))
    }
    return { defs, loc }
}

type Parser = {
    readonly config: Config
    readonly lex: Lex
}

function parseAliased(p: Parser): ast.AliasedType {
    const comment = p.lex.comment
    const keyword = p.lex.token
    const loc = p.lex.location()
    if (keyword !== "enum" && keyword !== "struct" && keyword !== "type") {
        throw new CompilerError("''type' is expected.", loc)
    }
    p.lex.forth()
    const alias = p.lex.token
    p.lex.forth()
    if (p.lex.token === "=") {
        throw new CompilerError(
            "a type definition and its body cannot be separated by '='.",
            p.lex.location(),
        )
    }
    if ((keyword === "enum" || keyword === "struct") && !p.config.legacy) {
        throw new CompilerError(
            `use 'type ${alias} ${keyword} { ... }' or allow '${keyword} ${alias} { ... }' with option '--legacy'.`,
            p.lex.location(),
        )
    }
    const type =
        keyword === "enum"
            ? parseEnumBody(p, p.lex.location())
            : keyword === "struct"
            ? parseStructBody(p)
            : parseTypeCheckUnion(p)
    checkSeparator(p)
    return { alias, internal: false, comment, type, loc }
}

function parseType(p: Parser): ast.Type {
    switch (p.lex.token) {
        case "":
            throw new CompilerError("a type is expected.", p.lex.location())
        case "[": // list (obsolete syntax)
            return parseLegacyList(p)
        case "(": // union (obsolete syntax)
            return parseLegacyUnion(p)
        case "{": {
            // struct (obsolete syntax)
            if (!p.config.legacy) {
                throw new CompilerError(
                    "use 'struct { ... } or allow '{ ... }' with option '--legacy'.",
                    p.lex.location(),
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
            p.lex.location(),
        )
    }
    return result
}

function parseTypeName(p: Parser): ast.Type {
    const alias = p.lex.token
    const loc = p.lex.location()
    p.lex.forth()
    if (alias === "string" && !p.config.legacy) {
        throw new CompilerError(
            "use 'str' or allow 'string' with option '--legacy'.",
            p.lex.location(),
        )
    }
    const tag = alias === "string" ? "str" : alias
    if (ast.isBaseTag(tag) || tag === "void") {
        return { tag, data: null, types: null, extra: null, loc }
    } else {
        return { tag: "alias", data: alias, types: null, extra: null, loc }
    }
}

function parseData(p: Parser): ast.Type {
    let len: ast.Length | null
    const loc = p.lex.location()
    expect(p, "data")
    if (p.lex.token === "<") {
        if (!p.config.legacy) {
            throw new CompilerError(
                "use 'data[n]' or allow 'data<n>' with option '--legacy'.",
                p.lex.location(),
            )
        }
        p.lex.forth()
        const loc = p.lex.location()
        len = {
            name: null,
            val: parseUnsignedNumber(p),
            comment: null,
            extra: null,
            loc,
        }
        expect(p, ">")
    } else {
        len = parseOptionalLength(p)
    }
    return { tag: "data", data: len, types: null, extra: null, loc }
}

function parseList(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "list")
    const valType = parseTypeParameter(p)
    const len = parseOptionalLength(p)
    return {
        tag: "list",
        data: len,
        types: [valType],
        extra: null,
        loc,
    }
}

function parseLegacyList(p: Parser): ast.Type {
    if (!p.config.legacy) {
        throw new CompilerError(
            "use 'list<A>[n]' or allow '[n]A' with option '--legacy'.",
            p.lex.location(),
        )
    }
    let len: ast.Length | null = null
    const loc = p.lex.location()
    expect(p, "[")
    if (p.lex.token !== "]") {
        const loc = p.lex.location()
        len = {
            name: null,
            val: parseUnsignedNumber(p),
            comment: null,
            extra: null,
            loc,
        }
        expect(p, "]")
    } else {
        p.lex.forth()
    }
    return {
        tag: "list",
        data: len,
        types: [parseType(p)],
        extra: null,
        loc,
    }
}

function parseOptional(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "optional")
    return {
        tag: "optional",
        data: null,
        types: [parseTypeParameter(p)],
        extra: null,
        loc,
    }
}

function parseMap(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "map")
    let keyType: ast.Type
    let valType: ast.Type
    if (p.lex.token === "[") {
        if (!p.config.legacy) {
            throw new CompilerError(
                "use 'map<A><B>' or allow 'map[A]B' with option '--legacy'.",
                p.lex.location(),
            )
        }
        p.lex.forth()
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
        loc,
    }
}

function parseUnion(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "union")
    expect(p, "{")
    const result = parseUnionBody(p, loc)
    expect(p, "}")
    return result
}

function parseLegacyUnion(p: Parser): ast.Type {
    if (!p.config.legacy) {
        throw new CompilerError(
            "use 'union { A | B } or allow '( A | B )' with option '--legacy'.",
            p.lex.location(),
        )
    }
    const loc = p.lex.location()
    expect(p, "(")
    const result = parseUnionBody(p, loc)
    expect(p, ")")
    return result
}

function parseUnionBody(p: Parser, loc: Location): ast.Type {
    const tags: ast.UnionTag[] = []
    const types: ast.Type[] = []
    let tagVal = 0
    do {
        let comment = p.lex.comment
        if (p.lex.token === "|") {
            p.lex.forth()
            if (p.lex.comment !== "") {
                comment = p.lex.comment
            }
        }
        if (p.lex.token === ")" || p.lex.token === "}") {
            break
        }
        const type = parseType(p)
        let loc: Location | null = null
        if (p.lex.token === "=") {
            p.lex.forth()
            loc = p.lex.location()
            tagVal = parseUnsignedNumber(p)
        } else if (p.config.pedantic) {
            throw new CompilerError(
                "in pedantic mode, all union tags must be set. '=' is expected.",
                p.lex.location(),
            )
        }
        tags.push({
            name: null,
            val: tagVal,
            comment,
            extra: null,
            loc,
        })
        types.push(type)
        tagVal++
        if (p.lex.token === "," || p.lex.token === ";") {
            throw new CompilerError(
                "union members must be separated with '|'.",
                p.lex.location(),
            )
        }
    } while (p.lex.token === "|")
    return { tag: "union", data: tags, types, extra: null, loc }
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
    let val = 0
    while (ALL_CASE_RE.test(p.lex.token)) {
        const comment = p.lex.comment
        let name = p.lex.token
        if (!CONSTANT_CASE_RE.test(name)) {
            throw new CompilerError(
                "the name of an enum member must be in CONSTANT_CASE.",
                p.lex.location(),
            )
        }
        const valLoc = p.lex.location()
        p.lex.forth()
        if (p.lex.token === "=") {
            p.lex.forth()
            val = parseUnsignedNumber(p)
        } else if (p.config.pedantic) {
            throw new CompilerError(
                "in pedantic mode, all enum tags must be set. '=' is expected.",
                p.lex.location(),
            )
        }
        name = toPascalCase(name)
        vals.push({ name, val, comment, extra: null, loc: valLoc })
        val++
        checkSeparator(p)
    }
    expect(p, "}")
    return { tag: "enum", data: vals, types: null, extra: null, loc }
}

function parseStruct(p: Parser): ast.Type {
    expect(p, "struct")
    return parseStructBody(p)
}

function parseStructBody(p: Parser): ast.Type {
    const loc = p.lex.location()
    expect(p, "{")
    const fields: ast.StructField[] = []
    const types: ast.Type[] = []
    while (ALL_CASE_RE.test(p.lex.token)) {
        const comment = p.lex.comment
        const name = p.lex.token
        const fieldLoc = p.lex.location()
        p.lex.forth()
        expect(p, ":")
        const type = parseTypeCheckUnion(p)
        checkSeparator(p)
        fields.push({ name, val: null, comment, extra: null, loc: fieldLoc })
        types.push(type)
    }
    expect(p, "}")
    return { tag: "struct", data: fields, types, extra: null, loc }
}

function parseOptionalLength(p: Parser): ast.Length | null {
    if (p.lex.token === "[") {
        p.lex.forth()
        const loc = p.lex.location()
        const val = parseUnsignedNumber(p)
        expect(p, "]")
        return { name: null, val, comment: null, extra: null, loc }
    } else {
        return null
    }
}

function parseTypeParameter(p: Parser): ast.Type {
    expect(p, "<")
    const result = parseType(p)
    if (p.lex.token === "," || p.lex.token === ";") {
        throw new CompilerError(
            "every type must be enclosed with '<>'. e.g. 'map<Key><Val>'.",
            p.lex.location(),
        )
    }
    expect(p, ">")
    return result
}

function checkSeparator(p: Parser): void {
    if (p.lex.token === "," || p.lex.token === ";") {
        throw new CompilerError(
            `members cannot be separated by '${p.lex.token}'.`,
            p.lex.location(),
        )
    }
}

function parseUnsignedNumber(p: Parser): number {
    const token = p.lex.token
    if (!/^\d+$/.test(token)) {
        throw new CompilerError(
            "an unsigned integer is expected.",
            p.lex.location(),
        )
    }
    p.lex.forth()
    return Number.parseInt(token, 10)
}

function expect(p: Parser, token: string): void {
    if (p.lex.token !== token) {
        throw new CompilerError(`'${token}' is expected.`, p.lex.location())
    }
    p.lex.forth()
}
