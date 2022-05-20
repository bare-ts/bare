//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import type * as ast from "../ast/bare-ast.js"
import { indent, unindent } from "../utils/formatting.js"

export function generateBare(schema: ast.Ast): string {
    let result = ""
    for (const def of schema.defs) {
        if (!def.internal) {
            result += generateAliased(def) + "\n\n"
        }
    }
    return result.trim()
}

function generateAliased(aliased: ast.AliasedType): string {
    const docComment = generateDocComment(aliased.comment)
    const typedef = generateType(aliased.type)
    return `${docComment}type ${aliased.alias} ${typedef}`
}

function generateType(type: ast.Type): string {
    switch (type.tag) {
        case "alias":
            return type.data
        case "data":
            return generateData(type)
        case "enum":
            return generateEnum(type)
        case "list":
            return generateList(type)
        case "map":
            return generateMap(type)
        case "optional":
            return generateOptional(type)
        case "struct":
            return generateStruct(type)
        case "union":
            return generateUnion(type)
        default:
            return type.tag
    }
}

function generateData(type: ast.DataType): string {
    const len = generateOptionalLength(type.data)
    return unindent(`data${len}`)
}

function generateEnum(type: ast.EnumType): string {
    const body = type.data.map(generateEnumVal).join("\n")
    return unindent(`enum {
        ${indent(body.trim(), 2)}
    }`)
}

function generateEnumVal(enumVal: ast.EnumVal): string {
    const docCOmment = generateDocComment(enumVal.comment)
    return `${docCOmment}${enumVal.name} = ${enumVal.val}`
}

function generateList(type: ast.ListType): string {
    const valTypedef = generateType(type.types[0])
    const len = generateOptionalLength(type.data)
    return unindent(`list<${indent(valTypedef, 1)}>${len}`)
}

function generateMap(type: ast.MapType): string {
    const keyTypedef = generateType(type.types[0])
    const valTypedef = generateType(type.types[1])
    return unindent(`map<${indent(keyTypedef, 1)}><${indent(valTypedef, 1)}>`)
}

function generateOptional(type: ast.OptionalType): string {
    const valTypedef = generateType(type.types[0])
    return unindent(`optional<${indent(valTypedef, 1)}>`)
}

function generateStruct(type: ast.StructType): string {
    const body = type.data
        .map((field, i) => generateStructField(field, type.types[i]))
        .join("\n")
    return unindent(`struct {
        ${indent(body.trim(), 2)}
    }`)
}

function generateStructField(field: ast.StructField, type: ast.Type): string {
    const docComment = generateDocComment(field.comment)
    const fieldTypedef = generateType(type)
    return `${docComment}${field.name}: ${fieldTypedef}`
}

function generateUnion(type: ast.UnionType): string {
    const body = type.data
        .map((tag, i) => generateUnionMember(tag, type.types[i]))
        .join("\n")
    return unindent(`union {
        ${indent(body.trim(), 2)}
    }`)
}

function generateUnionMember(tag: ast.UnionTag, type: ast.Type): string {
    const typedef = generateType(type)
    return `| ${typedef} = ${tag.val}`
}

function generateOptionalLength(length: ast.Length | null): string {
    return length !== null ? `[${length.val}]` : ""
}

function generateDocComment(comment: string | null): string {
    return comment !== null
        ? "##" + comment.trimEnd().split("\n").join("\n##") + "\n"
        : ""
}
