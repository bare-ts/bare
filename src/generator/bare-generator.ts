//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import type * as ast from "../ast/bare-ast.ts"
import { dent, toConstantCase } from "../utils/formatting.ts"

export function generateBare(schema: ast.Ast): string {
    let result = ""
    for (const def of schema.defs) {
        if (!def.internal) {
            result += `${genAliased(def)}\n\n`
        }
    }
    return result.trim()
}

function genAliased(type: ast.AliasedType): string {
    return `${genDoc(type.comment)}type ${type.alias} ${genType(type.type)}`
}

function genType(type: ast.Type): string {
    switch (type.tag) {
        case "alias":
            return type.data
        case "data":
            return genData(type)
        case "enum":
            return genEnum(type)
        case "list":
            return genList(type)
        case "map":
            return genMap(type)
        case "optional":
            return genOptional(type)
        case "struct":
            return genStruct(type)
        case "union":
            return genUnion(type)
        default:
            return type.tag
    }
}

function genData(type: ast.DataType): string {
    return `data${genOptionalLength(type.data)}`
}

function genEnum(type: ast.EnumType): string {
    let body = ""
    for (const enumVal of type.data) {
        body += `${genEnumVal(enumVal)}\n`
    }
    return dent`
        enum {
            ${body.trim()}
        }
    `
}

function genEnumVal(type: ast.EnumVal): string {
    return `${genDoc(type.comment)}${toConstantCase(type.name)} = ${type.val}`
}

function genList(type: ast.ListType): string {
    return `list<${genType(type.types[0])}>${genOptionalLength(type.data)}`
}

function genMap(type: ast.MapType): string {
    const keyTypedef = genType(type.types[0])
    const valTypedef = genType(type.types[1])
    return `map<${keyTypedef}><${valTypedef}>`
}

function genOptional(type: ast.OptionalType): string {
    return `optional<${genType(type.types[0])}>`
}

function genStruct(type: ast.StructType): string {
    const fields = type.data
    let body = ""
    for (let i = 0; i < fields.length; i++) {
        body += `${genStructField(fields[i], type.types[i])}\n`
    }
    return dent`
        struct {
            ${body.trim()}
        }
    `
}

function genStructField(field: ast.StructField, type: ast.Type): string {
    return `${genDoc(field.comment)}${field.name}: ${genType(type)}`
}

function genUnion(type: ast.UnionType): string {
    const tags = type.data
    let body = ""
    for (let i = 0; i < tags.length; i++) {
        body += `${genUnionMember(tags[i], type.types[i])}\n`
    }
    return dent`
        union {
            ${body.trim()}
        }
    `
}

function genUnionMember(tag: ast.UnionTag, type: ast.Type): string {
    return `| ${genType(type)} = ${tag.val}`
}

function genOptionalLength(length: ast.Length | null): string {
    return length != null ? `[${length.val}]` : ""
}

function genDoc(comment: string): string {
    return comment !== "" ? `#${comment.trimEnd().replace(/\n/g, "\n#")}\n` : ""
}
