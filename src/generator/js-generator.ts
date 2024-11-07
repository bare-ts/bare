//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as ast from "../ast/bare-ast.js"
import type { Config } from "../core/config.js"
import {
    capitalize,
    dent,
    jsDoc,
    jsRpr,
    softSpace,
} from "../utils/formatting.js"
import * as utils from "./bare-ast-utils.js"

export function generate(schema: ast.Ast, config: Config): string {
    const g: Gen = { config, symbols: ast.symbols(schema) }
    let body = ""
    const rootAliases = ast.rootAliases(schema.defs)
    let hasEncodeDecode = false
    for (const aliased of schema.defs) {
        const isVoid = ast.resolveAlias(aliased.type, g.symbols).tag === "void"
        switch (g.config.generator) {
            case "dts": {
                if (!aliased.internal) {
                    body += `${genAliasedType(g, aliased)}\n\n`
                    if (!isVoid) {
                        body += `export ${genReaderHead(g, aliased)}\n\n`
                        body += `export ${genWriterHead(g, aliased)}\n\n`
                    }
                }
                break
            }
            case "js": {
                const code = genCode(g, aliased)
                body += code !== "" ? `${code}\n\n` : ""
                if (!isVoid) {
                    body += `${genAliasedReader(g, aliased)}\n\n`
                    body += `${genAliasedWriter(g, aliased)}\n\n`
                }
                break
            }
            case "ts": {
                if (!aliased.internal) {
                    const aliasedType = genAliasedType(g, aliased)
                    body += aliasedType !== "" ? `${aliasedType}\n\n` : ""
                }
                const code = genCode(g, aliased)
                body += code !== "" ? `${code}\n\n` : ""
                if (!isVoid) {
                    body += `${genAliasedReader(g, aliased)}\n\n`
                    body += `${genAliasedWriter(g, aliased)}\n\n`
                }
                break
            }
        }
        if (
            !(isVoid || config.lib) &&
            rootAliases.indexOf(aliased.alias) !== -1
        ) {
            hasEncodeDecode = true
            switch (g.config.generator) {
                case "dts": {
                    body += `export ${genEncoderHead(g, aliased.alias)}\n\n`
                    body += `export ${genDecoderHead(g, aliased.alias)}\n\n`
                    break
                }
                case "js":
                case "ts": {
                    body += `export ${genEncoder(g, aliased.alias)}\n\n`
                    body += `export ${genDecoder(g, aliased.alias)}\n\n`
                    break
                }
            }
        }
    }
    let head = ""
    if (/\bassert\(/.test(body)) {
        head += 'import assert from "node:assert/strict"\n'
    }
    if (/bare\./.test(body)) {
        head += // Are values imported?
            g.config.generator !== "ts" ||
            /bare\.[a-z]/.test(body) ||
            hasEncodeDecode
                ? 'import * as bare from "@bare-ts/lib"\n'
                : 'import type * as bare from "@bare-ts/lib"\n'
    }
    if (/ext\./.test(body)) {
        head += '\nimport * as ext from "./ext.js"\n'
    }
    if (hasEncodeDecode && g.config.generator !== "dts") {
        head += "\nconst DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})\n"
    }
    if (g.config.generator !== "js") {
        head += "\n"
        const predefinedTypes: string[] = ast.NUMERIC_TAG.slice()
        predefinedTypes.push("i64Safe", "intSafe", "u64Safe", "uintSafe")
        for (const tag of predefinedTypes) {
            if (new RegExp(`\\b${tag}\\b`).test(body)) {
                const typeofVal =
                    tag === "i64" ||
                    tag === "int" ||
                    tag === "u64" ||
                    tag === "uint"
                        ? "bigint"
                        : "number"
                head += `export type ${tag} = ${typeofVal}\n`
            }
        }
    }
    return `${`${head.trim()}\n\n${body}`.trim()}\n`
}

type Gen = {
    readonly config: Config
    readonly symbols: ast.SymbolTable
}

// TS type generation

function genAliasedType(g: Gen, aliased: ast.AliasedType): string {
    const { alias, comment, type } = aliased
    const doc = jsDoc(comment)
    switch (type.tag) {
        case "enum":
            return `${doc}export ${genAliasedEnumType(g, alias, type)}`
        case "struct": {
            const isClass = type.extra?.class
            if (!isClass) {
                const structDef = genStructType(g, type)
                return `${doc}export type ${alias} = ${structDef}`
            }
            if (g.config.generator !== "dts") {
                return "" // A non-ambient class will be generated
            }
            return dent`
                ${doc}export declare class ${alias} {
                    ${genStructTypeClassBody(g, type)}
                }
            `
        }
    }
    const def = genType(g, type)
    return `${doc}export type ${alias} =${softSpace(def)}`
}

function namespaced(g: Gen, alias: string): string {
    return g.symbols.get(alias) != null ? "" : "ext."
}

function genType(g: Gen, type: ast.Type): string {
    switch (type.tag) {
        case "alias":
            return genAliasType(g, type)
        case "bool":
            return "boolean"
        case "data":
            return global(g, "ArrayBuffer")
        case "enum":
            return genEnumType(g, type)
        case "list":
            return genListType(g, type)
        case "map":
            return genMapType(g, type)
        case "optional":
            return genOptionalType(g, type)
        case "str":
            return "string"
        case "struct":
            return genStructType(g, type)
        case "union":
            return genUnionType(g, type)
        case "void":
            return noneVal(type)
    }
    if (type.extra?.safe) {
        return `${type.tag}Safe`
    }
    return type.tag
}

function genAliasType(g: Gen, type: ast.Alias): string {
    const alias = type.data
    const aliased = g.symbols.get(alias)
    if (aliased?.internal) {
        return genType(g, aliased.type) // inline a non-exported aliased type
    }
    return `${namespaced(g, alias)}${alias}`
}

function genListType(g: Gen, type: ast.ListType): string {
    const valType = type.types[0]
    const typedArray = ast.FIXED_NUMERIC_TYPE_TO_TYPED_ARRAY.get(valType.tag)
    if (type.extra?.typedArray && typedArray != null) {
        return global(g, typedArray)
    }
    if (type.extra?.unique) {
        return genSetType(g, type)
    }
    return genListRawType(g, type)
}

function genListRawType(g: Gen, type: ast.ListType): string {
    const valTypedef = genType(g, type.types[0])
    return type.extra?.mut
        ? `${valTypedef}[]`
        : /^\w+$/.test(valTypedef)
          ? `readonly ${valTypedef}[]`
          : `readonly (${valTypedef})[]` // union types, or readonly arrays, or ..
}

function genEnumType(_g: Gen, type: ast.EnumType): string {
    let result = ""
    for (const { name, val } of type.data) {
        if (result !== "") {
            result += " | "
        }
        result += type.extra?.intEnum ? `${val}` : jsRpr(name)
    }
    return result
}

function genAliasedEnumType(g: Gen, alias: string, type: ast.EnumType): string {
    let body = ""
    for (const { name, val, comment } of type.data) {
        if (body !== "") {
            body += "\n"
        }
        const enumJsVal = type.extra?.intEnum ? `${val}` : `"${name}"`
        body += `${jsDoc(comment)}${name} = ${enumJsVal},`
    }
    const modifier = g.config.generator === "dts" ? "declare " : ""
    return dent`
        ${modifier}enum ${alias} {
            ${body}
        }
    `
}

function genOptionalType(g: Gen, type: ast.OptionalType): string {
    const simplified = utils.unrecursive(type, g.symbols)
    if (simplified.tag === "optional") {
        const typedef = genType(g, simplified.types[0])
        return `${typedef} | ${noneVal(simplified)}`
    }
    return genType(g, simplified)
}

function genMapType(g: Gen, type: ast.MapType): string {
    const genKeyType = genType(g, type.types[0])
    const genValType = genType(g, type.types[1])
    const mapType = type.extra?.mut ? "Map" : "ReadonlyMap"
    return `${global(g, mapType)}<${genKeyType}, ${genValType}>`
}

function genSetType(g: Gen, type: ast.ListType): string {
    const typedef = genType(g, type.types[0])
    const setType = type.extra?.mut ? "Set" : "ReadonlySet"
    return `${global(g, setType)}<${typedef}>`
}

function genStructType(g: Gen, type: ast.StructType): string {
    return dent`
        {
            ${genStructTypeBody(g, type)}
        }
    `
}

function genStructTypeBody(g: Gen, type: ast.StructType): string {
    let result = ""
    for (let i = 0; i < type.types.length; i++) {
        const field = type.data[i]
        const modifier = field.extra?.mut ? "" : "readonly "
        result += `${jsDoc(field.comment)}${modifier}${field.name}:${softSpace(
            genType(g, type.types[i]),
        )}\n`
    }
    return result.trim()
}

function genStructTypeClassBody(g: Gen, type: ast.StructType): string {
    let params = ""
    for (let i = 0; i < type.data.length; i++) {
        const { name } = type.data[i]
        params += `${name}_:${softSpace(genType(g, type.types[i]))},\n`
    }
    return dent`
        ${genStructTypeBody(g, type)}
        constructor(
            ${params.trim()}
        )
    `
}

function genUnionType(g: Gen, type: ast.UnionType): string {
    let result = ""
    for (let i = 0; i < type.types.length; i++) {
        const subtype = type.types[i]
        const doc = jsDoc(type.data[i].comment)
        const valType = genType(g, subtype)
        const tagVal =
            g.config.useIntTag ||
            subtype.tag !== "alias" ||
            g.symbols.get(subtype.data)?.internal
                ? type.data[i].val
                : jsRpr(subtype.data)
        result += type.extra?.flat
            ? `\n${doc}| ${valType}`
            : `\n${doc}| { readonly tag: ${tagVal}; readonly val: ${valType} }`
    }
    return result.replace(/\n/g, "\n    ")
}

function genReaderHead(g: Gen, aliased: ast.AliasedType): string {
    const alias = aliased.alias
    const rType = aliased.internal ? genType(g, aliased.type) : alias
    return g.config.generator === "js"
        ? `function read${alias}(bc)`
        : `function read${alias}(bc: bare.ByteCursor):${softSpace(rType)}`
}

function genWriterHead(g: Gen, aliased: ast.AliasedType): string {
    const alias = aliased.alias
    const xType = aliased.internal ? genType(g, aliased.type) : alias
    return g.config.generator === "js"
        ? `function write${alias}(bc, x)`
        : `function write${alias}(bc: bare.ByteCursor, x:${softSpace(
              xType,
          )}): void`
}

function genDecoderHead(g: Gen, alias: string): string {
    return g.config.generator === "js"
        ? `function decode${alias}(bytes)`
        : `function decode${alias}(bytes: Uint8Array): ${alias}`
}

function genEncoderHead(g: Gen, alias: string): string {
    return g.config.generator === "js"
        ? `function encode${alias}(x, config)`
        : g.config.generator === "ts"
          ? `function encode${alias}(x: ${alias}, config?: Partial<bare.Config>): Uint8Array`
          : `function encode${alias}(x: ${alias}, config?: Partial<bare.Config>): Uint8Array`
}

// JS/TS code

function genCode(g: Gen, aliased: ast.AliasedType): string {
    const modifier = aliased.internal ? "" : "export "
    if (aliased.type.tag === "enum" && g.config.generator === "js") {
        return modifier + genAliasedEnumCode(g, aliased.alias, aliased.type)
    }
    if (
        aliased.type.tag === "struct" &&
        aliased.type.extra?.class &&
        !aliased.internal
    ) {
        return modifier + genAliasedStructCode(g, aliased.alias, aliased.type)
    }
    return ""
}

function genAliasedEnumCode(g: Gen, alias: string, type: ast.EnumType): string {
    if (g.config.generator !== "js") {
        return ""
    }
    let body = ""
    for (const { name, val } of type.data) {
        body += type.extra?.intEnum
            ? `${name}: ${val},\n${val}: "${name}",\n`
            : `${name}: "${name}",\n`
    }
    const constAssert = g.config.generator !== "js" ? "as const" : ""
    return dent`
        const ${alias} = {
            ${body.trim()}
        }${constAssert}
    `
}

function genAliasedStructCode(
    g: Gen,
    alias: string,
    type: ast.StructType,
): string {
    const ts = g.config.generator === "ts"
    const members = ts ? `${genStructTypeBody(g, type)}\n` : ""
    let params = ""
    let assignments = ""
    for (let i = 0; i < type.data.length; i++) {
        const { name } = type.data[i]
        params += `${name}_${
            ts ? `:${softSpace(genType(g, type.types[i]))},` : ","
        }\n`
        assignments += `this.${name} = ${name}_\n`
    }
    return dent`
        class ${alias} {
            ${members}constructor(
                ${params.trim()}
            ) {
                ${assignments.trim()}
            }
        }
    `
}

// JS/TS reader generation

function genAliasedReader(g: Gen, aliased: ast.AliasedType): string {
    let body = genReader(g, aliased.type, aliased.alias)
    const mod = aliased.internal ? "" : "export "
    const head = genReaderHead(g, aliased)
    switch (body[0]) {
        case "{": // block
            return `${mod}${head} ${body}`
        case "(": {
            // expression
            body = body.slice(1, -1) // remove parenthesis
            return dent`
                ${mod}${head} {
                    return ${body}
                }
            `
        }
    }
    throw new Error("[internal] invalid reader template")
}

function genReading(g: Gen, type: ast.Type): string {
    const body = genReader(g, type)
    switch (body[0]) {
        case "{": // function body
            return `(() => ${body})()`
        case "(": // expression
            return body.slice(1, -1) // remove parenthesis
    }
    throw new Error("[internal] invalid reader template")
}

function genReader(g: Gen, type: ast.Type, alias = ""): string {
    switch (type.tag) {
        case "alias":
            return `(${namespaced(g, type.data)}read${type.data}(bc))`
        case "bool":
            return "(bare.readBool(bc))"
        case "list":
            return genListReader(g, type)
        case "data":
            return genDataReader(g, type)
        case "enum":
            return genEnumReader(g, type, alias)
        case "map":
            return genMapReader(g, type)
        case "optional":
            return genOptionalReader(g, type)
        case "str":
            return "(bare.readString(bc))"
        case "struct":
            return genStructReader(g, type, alias)
        case "union":
            return genUnionReader(g, type)
        case "void":
            return `(${noneVal(type)})`
    }
    if (type.extra?.safe) {
        return `(bare.read${capitalize(type.tag)}Safe(bc))`
    }
    return `(bare.read${capitalize(type.tag)}(bc))`
}

function genListReader(g: Gen, type: ast.ListType): string {
    if (type.extra?.typedArray) {
        return genTypedArrayReader(g, type)
    }
    if (type.extra?.unique) {
        return genSetReader(g, type)
    }
    return genListRawReader(g, type)
}

function genListRawReader(g: Gen, type: ast.ListType): string {
    const lenDecoding =
        type.data != null
            ? `${type.data.val}`
            : dent`
                bare.readUintSafe(bc)
                if (len === 0) {
                    return []
                }
            `
    const valReading = genReading(g, type.types[0])
    return dent`
        {
            const len = ${lenDecoding}
            const result = [${valReading}]
            for (let i = 1; i < len; i++) {
                result[i] = ${valReading}
            }
            return result
        }
    `
}

function genDataReader(_g: Gen, type: ast.DataType): string {
    if (type.data != null) {
        return `(bare.readFixedData(bc, ${type.data.val}))`
    }
    return "(bare.readData(bc))"
}

function genEnumReader(g: Gen, type: ast.EnumType, alias: string): string {
    let body: string
    const maxTag = ast.maxVal(type.data)
    const tagReader = maxTag < 128 ? "readU8" : "readUintSafe"
    const intEnum = type.extra?.intEnum
    if (intEnum && maxTag === type.data.length - 1) {
        const rType = alias === "" ? genType(g, type) : alias
        const typeAssert = g.config.generator === "js" ? "" : ` as ${rType}`
        body = dent`
            if (tag > ${maxTag}) {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
            return tag${typeAssert}
        `
    } else {
        let switchBody = ""
        for (const { name, val } of type.data) {
            const enumVal =
                alias !== "" ? `${alias}.${name}` : intEnum ? val : `"${name}"`
            switchBody += dent`
            case ${val}:
                return ${enumVal}

            `
        }
        body = dent`
            switch (tag) {
                ${switchBody.trim()}
                default: {
                    bc.offset = offset
                    throw new bare.BareError(offset, "invalid tag")
                }
            }
        `
    }
    return dent`
        {
            const offset = bc.offset
            const tag = bare.${tagReader}(bc)
            ${body}
        }
    `
}

function genMapReader(g: Gen, type: ast.MapType): string {
    const [keyType, valType] = type.types
    const kType = genType(g, keyType)
    const vType = genType(g, valType)
    const mapGenerics =
        g.config.generator === "js" ? "" : `<${kType}, ${vType}>`
    const map = global(g, "Map")
    return dent`
        {
            const len = bare.readUintSafe(bc)
            const result = new ${map}${mapGenerics}()
            for (let i = 0; i < len; i++) {
                const offset = bc.offset
                const key = ${genReading(g, keyType)}
                if (result.has(key)) {
                    bc.offset = offset
                    throw new bare.BareError(offset, "duplicated key")
                }
                result.set(key, ${genReading(g, valType)})
            }
            return result
        }
    `
}

function genOptionalReader(g: Gen, type: ast.OptionalType): string {
    return dent`
        (bare.readBool(bc) ? ${genReading(g, type.types[0])} : ${noneVal(type)})
    `
}

function genSetReader(g: Gen, type: ast.ListType): string {
    const valType = type.types[0]
    const setGenerics =
        g.config.generator === "js" ? "" : `<${genType(g, valType)}>`
    const set = global(g, "Set")
    return dent`
        {
            const len = bare.readUintSafe(bc)
            const result = new ${set}${setGenerics}()
            for (let i = 0; i < len; i++) {
                const offset = bc.offset
                const val = ${genReading(g, valType)}
                if (result.has(val)) {
                    bc.offset = offset
                    throw new bare.BareError(offset, "duplicated value")
                }
                result.add(val)
            }
            return result
        }
    `
}

function genStructReader(g: Gen, type: ast.StructType, alias: string): string {
    let objCreation: string
    if (
        alias !== "" &&
        type.extra?.class &&
        g.symbols.get(alias)?.internal === false
    ) {
        let factoryArgs = ""
        for (const fieldType of type.types) {
            factoryArgs += `${genReading(g, fieldType)},\n`
        }
        objCreation = dent`
            (new ${alias}(
                ${factoryArgs.trim()}
            ))
        `
    } else {
        objCreation = genObjectReader(g, type)
    }
    return objCreation
}

function genObjectReader(g: Gen, type: ast.StructType): string {
    let objBody = ""
    for (let i = 0; i < type.types.length; i++) {
        const field = type.data[i]
        objBody += `${field.name}: ${genReading(g, type.types[i])},\n`
    }
    return dent`
        ({
            ${objBody.trim()}
        })
    `
}

function genTypedArrayReader(_g: Gen, type: ast.ListType): string {
    const typeName = capitalize(type.types[0].tag)
    if (type.data != null) {
        return `(bare.read${typeName}FixedArray(bc, ${type.data.val}))`
    }
    return `(bare.read${typeName}Array(bc))`
}

function genUnionReader(g: Gen, type: ast.UnionType): string {
    const tagReader = ast.maxVal(type.data) < 128 ? "readU8" : "readUintSafe"
    const flat = type.extra?.flat
    let switchBody = ""
    for (let i = 0; i < type.types.length; i++) {
        const subtype = type.types[i]
        const resolvedType = ast.resolveAlias(subtype, g.symbols)
        const valExpr =
            resolvedType.tag === "void"
                ? genReading(g, resolvedType)
                : genReading(g, subtype)
        const tagEncodedVal = type.data[i].val
        if (flat) {
            switchBody += dent`
            case ${tagEncodedVal}:
                return ${valExpr}

            `
        } else if (
            !g.config.useIntTag &&
            subtype.tag === "alias" &&
            !g.symbols.get(subtype.data)?.internal
        ) {
            switchBody += dent`
            case ${tagEncodedVal}:
                return { tag: ${jsRpr(subtype.data)}, val: ${valExpr} }

            `
        } else {
            switchBody += dent`
            case ${tagEncodedVal}:
                return { tag, val: ${valExpr} }

            `
        }
    }
    return dent`
        {
            const offset = bc.offset
            const tag = bare.${tagReader}(bc)
            switch (tag) {
                ${switchBody.trim()}
                default: {
                    bc.offset = offset
                    throw new bare.BareError(offset, "invalid tag")
                }
            }
        }
    `
}

// JS/TS writers generation

function genAliasedWriter(g: Gen, aliased: ast.AliasedType): string {
    let body = genWriter(g, aliased.type, aliased.alias).replace(/\$x\b/g, "x")
    const mod = aliased.internal ? "" : "export "
    const head = genWriterHead(g, aliased)
    switch (body[0]) {
        case "{": // block
            return `${mod}${head} ${body}`
        case "(": {
            body = body.slice(1, -1) // remove parenthesis
            if (body.length === 0) {
                body = "// do nothing"
            }
            return dent`
                ${mod}${head} {
                    ${body}
                }
            `
        }
    }
    throw new Error("[internal] invalid writer template")
}

function genWriting(g: Gen, type: ast.Type, x: string): string {
    const body = genWriter(g, type).replace(/\$x\b/g, x)
    switch (body[0]) {
        case "{": // block
            return body
        case "(":
            return body.slice(1, -1) // remove parenthesis
    }
    throw new Error("[internal] invalid writer template")
}

function genWriter(g: Gen, type: ast.Type, alias = ""): string {
    switch (type.tag) {
        case "alias":
            return `(${namespaced(g, type.data)}write${type.data}(bc, $x))`
        case "bool":
            return "(bare.writeBool(bc, $x))"
        case "list":
            return genListWriter(g, type)
        case "data":
            return genDataWriter(g, type)
        case "enum":
            return genEnumWriter(g, type, alias)
        case "map":
            return genMapWriter(g, type)
        case "optional":
            return genOptionalWriter(g, type)
        case "str":
            return "(bare.writeString(bc, $x))"
        case "struct":
            return genStructWriter(g, type)
        case "union":
            return genUnionWriter(g, type)
        case "void":
            return "()"
    }
    if (type.extra?.safe) {
        return `(bare.write${capitalize(type.tag)}Safe(bc, $x))`
    }
    return `(bare.write${capitalize(type.tag)}(bc, $x))`
}

function genListWriter(g: Gen, type: ast.ListType): string {
    if (type.extra?.typedArray) {
        return genTypedArrayWriter(g, type)
    }
    if (type.extra?.unique) {
        return genSetWriter(g, type)
    }
    return genListRawWriter(g, type)
}

function genListRawWriter(g: Gen, type: ast.ListType): string {
    const lenEncoding =
        type.data != null
            ? `assert($x.length === ${type.data.val}, "Unmatched length")`
            : "bare.writeUintSafe(bc, $x.length)"
    const writingElt = genWriting(g, type.types[0], "$x[i]")
    return dent`
        {
            ${lenEncoding}
            for (let i = 0; i < $x.length; i++) {
                ${writingElt}
            }
        }
    `
}

function genDataWriter(_g: Gen, type: ast.DataType): string {
    if (type.data == null) {
        return "(bare.writeData(bc, $x))"
    }
    return dent`
        {
            assert($x.byteLength === ${type.data.val})
            bare.writeFixedData(bc, $x)
        }
    `
}

function genEnumWriter(_g: Gen, type: ast.EnumType, alias: string): string {
    let body: string
    const intEnum = type.extra?.intEnum
    if (intEnum) {
        const tagWriter =
            ast.maxVal(type.data) < 128 ? "writeU8" : "writeUintSafe"
        body = `bare.${tagWriter}(bc, $x)`
    } else {
        let switchBody = ""
        for (const { name, val } of type.data) {
            const tagWriter = val < 128 ? "writeU8" : "writeUintSafe"
            const enumVal =
                alias !== "" ? `${alias}.${name}` : intEnum ? val : `"${name}"`
            switchBody += dent`
            case ${enumVal}: {
                bare.${tagWriter}(bc, ${val})
                break
            }

            `
        }
        body = dent`
            switch ($x) {
                ${switchBody.trim()}
            }
        `
    }
    return dent`
        {
            ${body}
        }
    `
}

function genMapWriter(g: Gen, type: ast.MapType): string {
    const writingKey = genWriting(g, type.types[0], "kv[0]")
    const writingVal = genWriting(g, type.types[1], "kv[1]")
    return dent`
        {
            bare.writeUintSafe(bc, $x.size)
            for (const kv of $x) {
                ${writingKey}
                ${writingVal}
            }
        }
    `
}

function genOptionalWriter(g: Gen, type: ast.OptionalType): string {
    const none = noneVal(type)
    const cmp =
        none === "null" || none === "undefined"
            ? "$x != null"
            : `$x !== ${none}`
    return dent`
        {
            bare.writeBool(bc, ${cmp})
            if (${cmp}) {
                ${genWriting(g, type.types[0], "$x")}
            }
        }
    `
}

function genSetWriter(g: Gen, type: ast.ListType): string {
    return dent`
        {
            bare.writeUintSafe(bc, $x.size)
            for (const v of $x) {
                ${genWriter(g, type.types[0], "v")}
            }
        }
    `
}

function genStructWriter(g: Gen, type: ast.StructType): string {
    let fieldEncoding = ""
    for (let i = 0; i < type.data.length; i++) {
        const { name } = type.data[i]
        const writing = genWriting(g, type.types[i], `$x.${name}`)
        if (writing !== "") {
            fieldEncoding += `${writing}\n`
        }
    }
    return dent`
        {
            ${fieldEncoding.trim()}
        }
    `
}

function genTypedArrayWriter(_g: Gen, type: ast.ListType): string {
    const typeName = capitalize(type.types[0].tag)
    if (type.data == null) {
        return `(bare.write${typeName}Array(bc, $x))`
    }
    return dent`
        {
            assert($x.length === ${type.data.val})
            bare.write${typeName}FixedArray(bc, $x)
        }
    `
}

function genUnionWriter(g: Gen, union: ast.UnionType): string {
    if (union.extra?.flat && union.types.every(ast.isBaseOrVoidType)) {
        return genBaseFlatUnionWriter(g, union)
    }
    if (
        union.extra?.flat &&
        union.types.every((t) => t.tag === "alias" || t.tag === "struct")
    ) {
        return genStructFlatUnionWriter(g, union)
    }
    return genTaggedUnionWriter(g, union)
}

function genStructFlatUnionWriter(g: Gen, union: ast.UnionType): string {
    const resolved = union.types.map((t) => ast.resolveAlias(t, g.symbols))
    if (!resolved.every((t) => t.tag === "struct")) {
        throw new Error("all types should be structs.")
    }
    const discriminators = ast.leadingDiscriminators(resolved)
    let body = ""
    if (
        resolved.every((t) => t.extra?.class) &&
        resolved.length === new Set(resolved).size
    ) {
        // every class is unique + we assume no inheritance between them
        // => we can discriminate based of the instance type
        for (let i = 0; i < union.types.length; i++) {
            if (body !== "") {
                body += " else "
            }
            const tagVal = union.data[i].val
            const tagWriter = tagVal < 128 ? "writeU8" : "writeUintSafe"
            const className = union.types[i].data as string
            const valWriting = genWriting(g, union.types[i], "$x")
            body += dent`
                if ($x instanceof ${className}) {
                    bare.${tagWriter}(bc, ${tagVal})
                    ${valWriting}
                }
            `
        }
    } else if (
        resolved.every((t) => !t.extra?.class) &&
        discriminators != null
    ) {
        const leadingFieldName = resolved[0].data[0].name
        let switchBody = ""
        for (let i = 0; i < union.types.length; i++) {
            const tagVal = union.data[i].val
            const tagWriter = tagVal < 128 ? "writeU8" : "writeUintSafe"
            const valWriting = genWriting(g, union.types[i], "$x")
            switchBody += dent`
                case ${jsRpr(discriminators[i])}: {
                    bare.${tagWriter}(bc, ${tagVal})
                    ${valWriting}
                    break
                }

            `
        }
        body = dent`
        switch ($x.${leadingFieldName}) {
            ${switchBody.trim()}
        }
        `
    }
    return dent`
        {
            ${body.trim()}
        }
    `
}

function genBaseFlatUnionWriter(g: Gen, union: ast.UnionType): string {
    if (!ast.haveDistinctTypeof(union.types)) {
        throw new Error("all types should have distinct typeof values.")
    } // every typeof value is unique => this discriminates the union
    let switchBody = ""
    let defaultCase = ""
    for (let i = 0; i < union.types.length; i++) {
        const tagVal = union.data[i].val
        const tagWriter = tagVal < 128 ? "writeU8" : "writeUintSafe"
        const type = union.types[i]
        if (type.tag === "void") {
            defaultCase = dent`
            default: {
                bare.${tagWriter}(bc, ${tagVal})
                break
            }

            `
        } else {
            const valWriting = genWriting(g, type, "$x")
            switchBody += dent`
            case "${ast.typeofValue(type as ast.BaseType)}": {
                bare.${tagWriter}(bc, ${tagVal})
                ${valWriting}
                break
            }

            `
        }
    }
    return dent`
        {
            switch (typeof $x) {
                ${switchBody.trim()}
                ${defaultCase.trim()}
            }
        }
    `
}

function genTaggedUnionWriter(g: Gen, type: ast.UnionType): string {
    const tagWriter = ast.maxVal(type.data) < 128 ? "writeU8" : "writeUintSafe"
    let switchBody = ""
    let hasStrTags = false
    for (let i = 0; i < type.types.length; i++) {
        const subtype = type.types[i]
        const tagEncodedVal = type.data[i].val
        if (ast.resolveAlias(subtype, g.symbols).tag !== "void") {
            const tagVal =
                g.config.useIntTag ||
                subtype.tag !== "alias" ||
                g.symbols.get(subtype.data)?.internal
                    ? tagEncodedVal
                    : jsRpr(subtype.data)
            const valWriting = genWriting(g, subtype, "$x.val")
            const maybeTagWriting =
                typeof tagVal === "string"
                    ? `bare.${tagWriter}(bc, ${tagEncodedVal})\n`
                    : ""
            hasStrTags ||= typeof tagVal === "string"
            const caseBody = `${maybeTagWriting}${valWriting}`
            switchBody += dent`
                case ${tagVal}: {
                    ${caseBody}
                    break
                }

            `
        } else if (
            !g.config.useIntEnum &&
            subtype.tag === "alias" &&
            !g.symbols.get(subtype.data)?.internal
        ) {
            hasStrTags ||= true
            switchBody += dent`
                case ${jsRpr(subtype.data)}: {
                    bare.${tagWriter}(bc, ${tagEncodedVal})
                    break
                }

            `
        }
    }
    const maybeTagWriting = hasStrTags ? "" : `bare.${tagWriter}(bc, $x.tag)\n`
    return dent`
        {
            ${maybeTagWriting}switch ($x.tag) {
                ${switchBody.trim()}
            }
        }
    `
}

// decode

function genDecoder(g: Gen, alias: string): string {
    return dent`
        ${genDecoderHead(g, alias)} {
            const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
            const result = read${alias}(bc)
            if (bc.offset < bc.view.byteLength) {
                throw new bare.BareError(bc.offset, "remaining bytes")
            }
            return result
        }
    `
}

// encode

function genEncoder(g: Gen, alias: string): string {
    const uint8Array = global(g, "Uint8Array")
    return dent`
        ${genEncoderHead(g, alias)} {
            const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
            const bc = new bare.ByteCursor(
                new ${uint8Array}(fullConfig.initialBufferLength),
                fullConfig,
            )
            write${alias}(bc, x)
            return new ${uint8Array}(bc.view.buffer, bc.view.byteOffset, bc.offset)
        }
    `
}

// utils

/**
 * Ensure that `name` is resolved in the global scope.
 */
function global(g: Gen, name: string): string {
    return g.symbols.has(name) ? `globalThis.${name}` : name
}

export function noneVal(type: ast.OptionalType | ast.VoidType): string {
    return type.extra != null
        ? jsRpr(ast.literalVal(type.extra.literal))
        : "null"
}
