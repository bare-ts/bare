//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import * as ast from "../ast/bare-ast.js"
import type { Config } from "../core/config.js"
import * as utils from "./bare-ast-utils.js"

export function generate(schema: ast.Ast, config: Config): string {
    const g: Gen = { config, symbols: ast.symbols(schema) }
    let body = ""
    for (const aliased of schema.defs) {
        switch (g.config.generator) {
            case "dts":
                if (!aliased.internal) {
                    body += `${genAliasedType(g, aliased)}\n\n`
                    body += `${genAliasedReaderHead(g, aliased)}\n\n`
                    body += `${genAliasedWriterHead(g, aliased)}\n\n`
                }
                break
            case "js": {
                const code = genCode(g, aliased)
                body += code !== "" ? code + "\n\n" : ""
                body += `${genAliasedReader(g, aliased)}\n\n`
                body += `${genAliasedWriter(g, aliased)}\n\n`
                break
            }
            case "ts": {
                if (!aliased.internal) {
                    const aliasedType = genAliasedType(g, aliased)
                    body += aliasedType !== "" ? aliasedType + "\n\n" : ""
                }
                const code = genCode(g, aliased)
                body += code !== "" ? code + "\n\n" : ""
                body += `${genAliasedReader(g, aliased)}\n\n`
                body += `${genAliasedWriter(g, aliased)}\n\n`
                break
            }
        }
        if (g.config.main.indexOf(aliased.alias) !== -1) {
            switch (g.config.generator) {
                case "dts":
                    body += `export ${genEncoderHead(g, aliased.alias)}\n\n`
                    body += `export ${genDecoderHead(g, aliased.alias)}\n\n`
                    break
                case "js":
                case "ts":
                    body += `export ${genEncoder(g, aliased.alias)}\n\n`
                    body += `export ${genDecoder(g, aliased.alias)}\n\n`
                    break
            }
        }
    }
    let head = ""
    if (/\bassert\(/.test(body)) {
        head += 'import assert from "assert"\n'
    }
    if (/bare\./.test(body)) {
        head += // Are values imported?
            g.config.generator !== "ts" ||
            /bare\.[a-z]/.test(body) ||
            g.config.main.length !== 0 // encoder/decoder import values
                ? 'import * as bare from "@bare-ts/lib"\n'
                : 'import type * as bare from "@bare-ts/lib"\n'
    }
    if (/ext\./.test(body)) {
        head += 'import * as ext from "./ext.js"\n'
    }
    if (
        g.config.main.length !== 0 &&
        !g.config.importConfig &&
        g.config.generator !== "dts"
    ) {
        head += "\nconst config = /* @__PURE__ */ bare.Config({})\n"
    }
    if (g.config.generator !== "js") {
        head += "\n"
        for (const tag of ast.BASE_TAG) {
            const typeofVal = ast.BASE_TAG_TO_TYPEOF[tag]
            if (
                (typeofVal === "number" || typeofVal === "bigint") &&
                RegExp(`\\b${tag}\\b`).test(body)
            ) {
                head += `export type ${tag} = ${typeofVal}\n`
            }
        }
    }
    return head.trim() + "\n\n" + body.trim() + "\n"
}

interface Gen {
    readonly config: Config
    readonly symbols: ast.SymbolTable
}

// TS type generation

function genAliasedType(g: Gen, { alias, type }: ast.AliasedType): string {
    switch (type.tag) {
        case "enum":
            return "export " + genAliasedEnumType(g, alias, type)
        case "struct": {
            if (g.config.importFactory) {
                const extType = type.props.class
                    ? `ext.${alias}`
                    : `ReturnType<typeof ext.${alias}>`
                return `export type ${alias} = ${extType}`
            }
            if (!type.props.class) {
                return `export interface ${alias} ${genStructType(g, type)}`
            } else if (g.config.generator !== "dts") {
                return "" // A non-ambient class will be generated
            }
            return unindent(
                `export declare class ${alias} {
                    ${indent(genStructTypeClassBody(g, type), 5)}
                }`,
                4,
            )
        }
    }
    return `export type ${alias} = ${genType(g, type)}`
}

function typeAliasOrDef(g: Gen, type: ast.Type, alias: string): string {
    const aliased = g.symbols.get(alias)
    return aliased !== undefined && !aliased.internal ? alias : genType(g, type)
    // TODO: just genType?
}

function namespaced(g: Gen, alias: string): string {
    return g.symbols.get(alias) !== undefined ? "" : "ext."
}

function genType(g: Gen, type: ast.Type): string {
    switch (type.tag) {
        case "alias":
            return genAliasType(g, type)
        case "list":
            return genListType(g, type)
        case "bool":
            return "boolean"
        case "data":
            return "ArrayBuffer"
        case "enum":
            return genEnumType(g, type)
        case "f32":
        case "f64":
        case "i8":
        case "i16":
        case "i32":
        case "i64":
        case "i64Safe":
        case "int":
        case "intSafe":
        case "u8":
        case "u8Clamped":
        case "u16":
        case "u32":
        case "u64":
        case "u64Safe":
        case "uint":
        case "uintSafe":
            return type.tag
        case "literal":
            return genLiteralType(g, type)
        case "map":
            return genMapType(g, type)
        case "optional":
            return genOptionalType(g, type)
        case "set":
            return genSetType(g, type)
        case "string":
            return "string"
        case "struct":
            return genStructType(g, type)
        case "typedarray":
            return genTypedArrayType(g, type)
        case "union":
            return genUnionType(g, type)
        case "void":
            return genVoidType(g, type)
    }
}

function genAliasType(g: Gen, type: ast.Alias): string {
    const aliased = g.symbols.get(type.props.alias)
    if (aliased !== undefined && aliased.internal) {
        return genType(g, aliased.type) // inline a non-exported aliased type
    }
    return `${namespaced(g, type.props.alias)}${type.props.alias}`
}

function genListType(g: Gen, type: ast.ListType): string {
    const valTypedef = genType(g, type.types[0])
    return type.props.mut
        ? `${valTypedef}[]`
        : /^\w+$/.test(valTypedef)
        ? `readonly ${valTypedef}[]`
        : `readonly (${valTypedef})[]` // union types, or readonly arrays, or ..
}

function genEnumType(_g: Gen, type: ast.EnumType): string {
    const { intEnum, vals } = type.props
    return vals
        .map(({ name, val }) => (intEnum ? `${val}` : rpr(name)))
        .join(" | ")
}

function genAliasedEnumType(g: Gen, alias: string, type: ast.EnumType): string {
    let body = ""
    for (const { name, val } of type.props.vals) {
        const enumJsVal = type.props.intEnum ? `${val}` : `"${name}"`
        body += `${name} = ${enumJsVal},\n`
    }
    body = body.slice(0, -1) // remove last newline
    const modifier = g.config.generator === "dts" ? "declare " : ""
    return unindent(`${modifier}enum ${alias} {
        ${indent(body, 2)}
    }`)
}

function genOptionalType(g: Gen, type: ast.OptionalType): string {
    const simplified = utils.unrecursive(type, g.symbols)
    if (simplified.tag === "optional") {
        type = simplified
        const typedef = genType(g, type.types[0])
        const optionalValue = type.props.lax
            ? "null | undefined"
            : type.props.undef
            ? "undefined"
            : "null"
        return `${typedef} | ${optionalValue}`
    } else {
        return genType(g, simplified)
    }
}

function genLiteralType(_g: Gen, type: ast.LiteralType): string {
    return literalValRepr(type.props)
}

function genMapType(g: Gen, type: ast.MapType): string {
    const genKeyType = genType(g, type.types[0])
    const genValType = genType(g, type.types[1])
    const mapType = type.props.mut ? "Map" : "ReadonlyMap"
    return `${mapType}<${genKeyType}, ${genValType}>`
}

function genSetType(g: Gen, type: ast.ListType): string {
    const typedef = genType(g, type.types[0])
    const setType = type.props.mut ? "Set" : "ReadonlySet"
    return `${setType}<${typedef}>`
}

function genStructType(g: Gen, type: ast.StructType): string {
    return unindent(`{
        ${indent(genStructTypeBody(g, type), 2)}
    }`)
}

function genStructTypeBody(g: Gen, type: ast.StructType): string {
    let result = ""
    for (let i = 0; i < type.types.length; i++) {
        const { mut, quoted, name } = type.props.fields[i]
        const modifier = mut ? "" : "readonly "
        const prop = quoted ? `"${name}"` : name
        result += `${modifier}${prop}: ${genType(g, type.types[i])}\n`
    }
    return result.trim()
}

function genStructTypeClassBody(g: Gen, type: ast.StructType): string {
    const params = type.props.fields
        .map(({ name }, i) => `${jsId(name)}: ${genType(g, type.types[i])},`)
        .join("\n")
    return unindent(`${indent(genStructTypeBody(g, type))}
    constructor(
        ${indent(params, 2)}
    )`)
}

function genTypedArrayType(_g: Gen, type: ast.TypedArrayType): string {
    return ast.FIXED_NUMBER_TYPE_TO_TYPED_ARRAY[type.types[0].tag]
}

function genUnionType(g: Gen, type: ast.UnionType): string {
    const tagProp = g.config.useQuotedProperty ? '"tag"' : "tag"
    const valProp = g.config.useQuotedProperty ? '"val"' : "val"
    let result = ""
    for (let i = 0; i < type.types.length; i++) {
        const valType = genType(g, type.types[i])
        const tagVal = type.props.tags[i].val
        result += type.props.flat
            ? `\n| ${valType}`
            : `\n| { readonly ${tagProp}: ${tagVal}; readonly ${valProp}: ${valType} }`
    }
    return indent(result)
}

function genVoidType(_g: Gen, type: ast.VoidType): string {
    return type.props.lax
        ? "undefined | null"
        : type.props.undef
        ? "undefined"
        : "null"
}

function genAliasedReaderHead(g: Gen, aliased: ast.AliasedType): string {
    return "export " + genReaderHead(g, aliased.type, `${aliased.alias}`)
}

function genReaderHead(g: Gen, type: ast.Type, alias: string): string {
    const rType = typeAliasOrDef(g, type, alias)
    const fname = alias !== "" ? `read${alias}` : ""
    return g.config.generator === "js"
        ? `function ${fname}(bc)`
        : `function ${fname}(bc: bare.ByteCursor): ${rType}`
}

function genAliasedWriterHead(g: Gen, aliased: ast.AliasedType): string {
    return "export " + genWriterHead(g, aliased.type, `${aliased.alias}`)
}

function genWriterHead(g: Gen, type: ast.Type, alias: string): string {
    const xType = typeAliasOrDef(g, type, alias)
    const fname = alias !== "" ? `write${alias}` : ""
    return g.config.generator === "js"
        ? `function ${fname}(bc, x)`
        : `function ${fname}(bc: bare.ByteCursor, x: ${xType}): void`
}

function genDecoderHead(g: Gen, alias: string): string {
    return g.config.generator === "js"
        ? `function decode${alias}(bytes)`
        : `function decode${alias}(bytes: Uint8Array): ${alias}`
}

function genEncoderHead(g: Gen, alias: string): string {
    return g.config.generator === "js"
        ? `function encode${alias}(x)`
        : `function encode${alias}(x: ${alias}): Uint8Array`
}

// JS/TS code

function genCode(g: Gen, aliased: ast.AliasedType): string {
    const modifier = !aliased.internal ? "export " : ""
    if (aliased.type.tag === "enum" && g.config.generator === "js") {
        return modifier + genAliasedEnumCode(g, aliased.alias, aliased.type)
    }
    if (
        aliased.type.tag === "struct" &&
        aliased.type.props.class &&
        !aliased.internal &&
        !g.config.importFactory
    ) {
        return modifier + genAliasedStructCode(g, aliased.alias, aliased.type)
    }
    return ""
}

function genAliasedEnumCode(g: Gen, alias: string, type: ast.EnumType): string {
    if (g.config.generator !== "js") {
        return ""
    }
    const body = type.props.vals
        .map(({ name, val }) =>
            type.props.intEnum
                ? `${name}: ${val},\n${val}: "${name}"`
                : `${name}: "${name}"`,
        )
        .join(",\n")
    const constAssert = g.config.generator !== "js" ? "as const" : ""
    return unindent(`const ${alias} = {
        ${indent(body, 2)}
    }${constAssert}`)
}

function genAliasedStructCode(
    g: Gen,
    alias: string,
    type: ast.StructType,
): string {
    const ts = g.config.generator === "ts"
    const members = ts ? "\n" + genStructTypeBody(g, type) : ""
    const params = type.props.fields
        .map(
            ({ name }, i) =>
                `${jsId(name)}` +
                (ts ? `: ${genType(g, type.types[i])},` : ","),
        )
        .join("\n")
    const assignments = type.props.fields
        .map(({ name }) => `this.${name} = ${jsId(name)}`)
        .join("\n")
    return unindent(`class ${alias} {${indent(members, 2)}
        constructor(
            ${indent(params, 3)}
        ) {
            ${indent(assignments, 3)}
        }
    }`)
}

// JS/TS reader generation

function genAliasedReader(g: Gen, aliased: ast.AliasedType): string {
    let body = genReader(g, aliased.type, aliased.alias)
    const mod = !aliased.internal ? "export " : ""
    const head = genReaderHead(g, aliased.type, aliased.alias)
    switch (body[0]) {
        case "{": // block
            return `${mod}${head} ${body}`
        case "(": {
            // expression
            const ret = indent("\nreturn ")
            body = body.slice(1, -1) // remove parenthesis
            return `${mod}${head} {${ret}${indent(body)}\n}`
        }
        default:
            throw Error("[internal] invalid reader template")
    }
}

function genReading(g: Gen, type: ast.Type): string {
    const body = genReader(g, type)
    switch (body[0]) {
        case "{": // function body
            return `(() => ${indent(body)})()`
        case "(": // expression
            return body.slice(1, -1) // remove parenthesis
        default:
            throw Error("[internal] invalid reader template")
    }
}

function genReader(g: Gen, type: ast.Type, alias = ""): string {
    if (ast.isBaseType(type)) {
        return `(bare.read${capitalize(type.tag)}(bc))`
    }
    switch (type.tag) {
        case "alias":
            return `(${namespaced(g, type.props.alias)}read${
                type.props.alias
            }(bc))`
        case "list":
            return genListReader(g, type)
        case "data":
            return genDataReader(g, type)
        case "enum":
            return genEnumReader(g, type, alias)
        case "literal":
            return genLiteralReader(g, type)
        case "map":
            return genMapReader(g, type)
        case "optional":
            return genOptionalReader(g, type)
        case "set":
            return genSetReader(g, type)
        case "struct":
            return genStructReader(g, type, alias)
        case "typedarray":
            return genTypedArrayReader(g, type)
        case "union":
            return genUnionReader(g, type)
        case "void":
            return genVoidReader(g, type)
    }
}

function genListReader(g: Gen, type: ast.ListType): string {
    const lenDecoding =
        type.props.len !== null
            ? `${type.props.len.val}`
            : `bare.readUintSafe(bc)\nif (len === 0) return []`
    const valReading = genReading(g, type.types[0])
    return unindent(`{
        const len = ${indent(lenDecoding, 2)}
        const result = [${indent(valReading, 2)}]
        for (let i = 1; i < len; i++) {
            result[i] = ${indent(valReading, 3)}
        }
        return result
    }`)
}

function genDataReader(_g: Gen, type: ast.DataType): string {
    if (type.props.len == null) {
        return `(bare.readData(bc))`
    }
    return `(bare.readFixedData(bc, ${type.props.len.val}))`
}

function genEnumReader(g: Gen, type: ast.EnumType, alias: string): string {
    let body: string
    const maxTag = max(type.props.vals.map((v) => v.val))
    const tagReader = maxTag < 128 ? "readU8" : "readUintSafe"
    const intEnum = type.props.intEnum
    if (intEnum && maxTag === type.props.vals.length - 1) {
        const rType = typeAliasOrDef(g, type, alias)
        const typeAssert = g.config.generator === "js" ? "" : ` as ${rType}`
        body = `if (tag > ${maxTag}) {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
        return tag${typeAssert}`
    } else {
        let switchBody = ""
        for (const { name, val } of type.props.vals) {
            const enumVal =
                alias !== "" ? `${alias}.${name}` : intEnum ? val : `"${name}"`
            switchBody += `
            case ${val}:
                return ${enumVal}`
        }
        body = `switch (tag) {
            ${switchBody.trim()}
            default: {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
        }`
    }
    return unindent(`{
        const offset = bc.offset
        const tag = bare.${tagReader}(bc)
        ${body}
    }`)
}

function genLiteralReader(_g: Gen, type: ast.LiteralType): string {
    return `(${literalValRepr(type.props)})`
}

function genMapReader(g: Gen, type: ast.MapType): string {
    const [keyType, valType] = type.types
    const kType = genType(g, keyType)
    const vType = genType(g, valType)
    const MapGenerics =
        g.config.generator === "js"
            ? ""
            : `<${indent(kType, 2)}, ${indent(vType, 2)}>`
    return unindent(`{
        const len = bare.readUintSafe(bc)
        const result = new Map${MapGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const key = ${indent(genReading(g, keyType), 2)}
            if (result.has(key)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated key")
            }
            result.set(key, ${indent(genReading(g, valType), 2)})
        }
        return result
    }`)
}

function genOptionalReader(g: Gen, type: ast.OptionalType): string {
    const noneVal = type.props.undef ? "undefined" : "null"
    return unindent(`(bare.readBool(bc)
        ? ${indent(genReading(g, type.types[0]), 3)}
        : ${noneVal})`)
}

function genSetReader(g: Gen, type: ast.ListType): string {
    const valType = type.types[0]
    const SetGenerics =
        g.config.generator === "js" ? "" : `<${indent(genType(g, valType), 2)}>`
    return unindent(`{
        const len = bare.readUintSafe(bc)
        const result = new Set${SetGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const val = ${indent(genReading(g, valType), 2)}
            if (result.has(val)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated value")
            }
            result.add(val)
        }
        return result
    }`)
}

function genStructReader(g: Gen, type: ast.StructType, alias: string): string {
    let objCreation: string
    if (
        alias !== "" &&
        ((type.props.class && g.symbols.get(alias)?.internal === false) ||
            g.config.importFactory)
    ) {
        const factoryArgs = type.props.fields
            .map((_f, i) => `\n${genReading(g, type.types[i])}`)
            .join(",")
        if (g.config.importFactory) {
            objCreation = `ext.${alias}(${indent(factoryArgs)}\n)`
            if (type.props.class) {
                objCreation = `new ` + objCreation
            }
        } else {
            objCreation = `new ${alias}(${indent(factoryArgs)})`
        }
        objCreation = `(${objCreation})`
    } else {
        objCreation = genObjectReader(g, type)
    }
    return objCreation
}

function genObjectReader(g: Gen, type: ast.StructType): string {
    let objBody = ""
    const fields = type.props.fields
    for (let i = 0; i < type.types.length; i++) {
        const prop = fields[i].quoted ? `"${fields[i].name}"` : fields[i].name
        objBody += `\n${prop}: ${genReading(g, type.types[i])},`
    }
    return unindent(`({
        ${indent(objBody.trim(), 2)}
    })`)
}

function genTypedArrayReader(_g: Gen, type: ast.TypedArrayType): string {
    const typeName = capitalize(type.types[0].tag)
    if (type.props.len == null) {
        return `(bare.read${typeName}Array(bc))`
    }
    return `(bare.read${typeName}FixedArray(bc, ${type.props.len.val}))`
}

function genUnionReader(g: Gen, type: ast.UnionType): string {
    const tagReader =
        max(type.props.tags.map((v) => v.val)) < 128 ? "readU8" : "readUintSafe"
    const flat = type.props.flat
    let switchBody = ""
    const tagPropSet = g.config.useQuotedProperty ? '"tag": tag' : "tag"
    const valProp = g.config.useQuotedProperty ? '"val"' : "val"
    for (let i = 0; i < type.types.length; i++) {
        const valExpr = genReading(g, type.types[i])
        if (flat) {
            switchBody += `
            case ${type.props.tags[i].val}:
                return ${valExpr}`
        } else {
            switchBody += `
            case ${type.props.tags[i].val}:
                return { ${tagPropSet}, ${valProp}: ${valExpr} }`
        }
    }
    return unindent(`{
        const offset = bc.offset
        const tag = bare.${tagReader}(bc)
        switch (tag) {
            ${switchBody.trim()}
            default: {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
        }
    }`)
}

function genVoidReader(_g: Gen, type: ast.VoidType): string {
    return type.props.undef ? "(undefined)" : "(null)"
}

// JS/TS writers generation

function genAliasedWriter(g: Gen, aliased: ast.AliasedType): string {
    let body = genWriter(g, aliased.type, aliased.alias).replace(/\$x\b/g, "x")
    const mod = aliased.internal ? "" : "export "
    const head = genWriterHead(g, aliased.type, aliased.alias)
    switch (body[0]) {
        case "{": // block
            return `${mod}${head} ${body}`
        case "(":
            body = body.slice(1, -1) // remove parenthesis
            body = "\n" + (body === "" ? "// do nothing" : body)
            return `${mod}${head} {${indent(body)}\n}`
        default:
            throw Error("[internal] invalid writer template")
    }
}

function genWriting(g: Gen, type: ast.Type, x: string): string {
    let body = genWriter(g, type).replace(/\$x\b/g, x)
    switch (body[0]) {
        case "{": // block
            return body
        case "(":
            body = body.slice(1, -1) // remove parenthesis
            return `${body}`
        default:
            throw Error("[internal] invalid writer template")
    }
}

function genWriter(g: Gen, type: ast.Type, alias = ""): string {
    if (ast.isBaseType(type)) {
        return `(bare.write${capitalize(type.tag)}(bc, $x))`
    }
    switch (type.tag) {
        case "alias":
            return `(${namespaced(g, type.props.alias)}write${
                type.props.alias
            }(bc, $x))`
        case "list":
            return genListWriter(g, type)
        case "data":
            return genDataWriter(g, type)
        case "enum":
            return genEnumWriter(g, type, alias)
        case "literal":
        case "void":
            return "()"
        case "map":
            return genMapWriter(g, type)
        case "optional":
            return genOptionalWriter(g, type)
        case "set":
            return genSetWriter(g, type)
        case "struct":
            return genStructWriter(g, type)
        case "typedarray":
            return genTypedArrayWriter(g, type)
        case "union":
            return genUnionWriter(g, type)
    }
}

function genListWriter(g: Gen, type: ast.ListType): string {
    const lenEncoding =
        type.props.len !== null
            ? `assert($x.length === ${type.props.len.val}, "Unmatched length")`
            : `bare.writeUintSafe(bc, $x.length)`
    const writingElt = genWriting(g, type.types[0], "$x[i]")
    return unindent(`{
        ${lenEncoding}
        for (let i = 0; i < $x.length; i++) {
            ${indent(writingElt, 3)}
        }
    }`)
}

function genDataWriter(_g: Gen, type: ast.DataType): string {
    if (type.props.len == null) {
        return `(bare.writeData(bc, $x))`
    }
    return unindent(`{
        assert($x.byteLength === ${type.props.len.val})
        bare.writeFixedData(bc, $x)
    }`)
}

function genEnumWriter(_g: Gen, type: ast.EnumType, alias: string): string {
    let body: string
    const intEnum = type.props.intEnum
    if (intEnum) {
        const maxTag = max(type.props.vals.map((v) => v.val))
        const tagWriter = maxTag < 128 ? "writeU8" : "writeUintSafe"
        body = `bare.${tagWriter}(bc, $x)`
    } else {
        let switchBody = ""
        for (const { name, val } of type.props.vals) {
            const tagWriter = val < 128 ? "writeU8" : "writeUintSafe"
            const enumVal =
                alias !== "" ? `${alias}.${name}` : intEnum ? val : `"${name}"`
            switchBody += `
            case ${enumVal}:
                bare.${tagWriter}(bc, ${val})
                break`
        }
        body = `switch ($x) {
            ${switchBody.trim()}
        }`
    }
    return unindent(`{
        ${body}
    }`)
}

function genMapWriter(g: Gen, type: ast.MapType): string {
    const writingKey = genWriting(g, type.types[0], "kv[0]")
    const writingVal = genWriting(g, type.types[1], "kv[1]")
    return unindent(`{
        bare.writeUintSafe(bc, $x.size)
        for(const kv of $x) {
            ${indent(writingKey, 2)}
            ${indent(writingVal, 2)}
        }
    }`)
}

function genOptionalWriter(g: Gen, type: ast.OptionalType): string {
    const presenceCmp = type.props.lax
        ? "!= null"
        : type.props.undef
        ? "!== undefined"
        : "!== null"
    return unindent(`{
        bare.writeBool(bc, $x ${presenceCmp})
        if ($x ${presenceCmp}) {
            ${indent(genWriting(g, type.types[0], "$x"), 3)}
        }
    }`)
}

function genSetWriter(g: Gen, type: ast.ListType): string {
    return unindent(`{
        bare.writeUintSafe(bc, $x.size)
        for (const v of $x) {
            ${indent(genWriter(g, type.types[0], "v"), 3)}
        }
    }`)
}

function genStructWriter(g: Gen, type: ast.StructType): string {
    const fieldEncoding = type.props.fields.map(({ quoted, name }, i) => {
        const propAccess = quoted ? `["${name}"]` : `.${name}`
        return genWriting(g, type.types[i], `$x${propAccess}`)
    })
    return unindent(`{
        ${indent(fieldEncoding.join("\n"), 2)}
    }`)
}

function genTypedArrayWriter(_g: Gen, type: ast.TypedArrayType): string {
    if (type.props.len == null) {
        return `(bare.write${capitalize(type.types[0].tag)}Array(bc, $x))`
    }
    return unindent(`{
        assert($x.length === ${type.props.len.val})
        bare.write${capitalize(type.types[0].tag)}FixedArray(bc, $x)
    }`)
}

function genUnionWriter(g: Gen, union: ast.UnionType): string {
    if (union.props.flat && union.types.every(ast.isBaseOrVoidType)) {
        const baseUnion = union as ast.UnionType<ast.BaseType | ast.VoidType>
        return genBaseFlatUnionWriter(g, baseUnion)
    }
    if (union.props.flat && union.types.every((t) => t.tag === "alias")) {
        const aliasesUnion = union as ast.UnionType<ast.Alias>
        return genAliasFlatUnionWriter(g, aliasesUnion)
    }
    return genTaggedUnionWriter(g, union)
}

function genAliasFlatUnionWriter(
    g: Gen,
    union: ast.UnionType<ast.Alias>,
): string {
    const resolved = union.types.map((t) => ast.resolveAlias(t, g.symbols))
    if (!resolved.every((t): t is ast.StructType => t.tag === "struct")) {
        throw new Error("all types should be structs.")
    }
    const discriminators = ast.leadingDiscriminators(resolved)
    let body = ""
    if (
        resolved.every((t) => t.props.class) &&
        resolved.length === new Set(resolved).size
    ) {
        // every class is unique + we assume no inheritance between them
        // => we can discriminate based of the instance type
        for (let i = 0; i < union.types.length; i++) {
            const tagVal = union.props.tags[i].val
            const tagWriter = tagVal < 128 ? "writeU8" : "writeUintSafe"
            const className = union.types[i].props.alias
            const valWriting = genWriting(g, union.types[i], "$x")
            body += `if ($x instanceof ${className}) {
                bare.${tagWriter}(bc, ${tagVal})
                ${indent(valWriting, 4)}
            } else `
        }
        body = body.slice(0, -6) // remove last 'else '
    } else if (
        resolved.every((t) => !t.props.class) &&
        discriminators !== null
    ) {
        const leadingFieldName = resolved[0].props.fields[0].name
        let switchBody = ""
        for (let i = 0; i < union.types.length; i++) {
            const tagVal = union.props.tags[i].val
            const tagWriter = tagVal < 128 ? "writeU8" : "writeUintSafe"
            const valWriting = genWriting(g, union.types[i], "$x")
            switchBody += `
            case ${rpr(discriminators[i])}:
                bare.${tagWriter}(bc, ${tagVal})
                ${indent(valWriting, 4)}
                break`
        }
        body = `switch ($x.${leadingFieldName}) {
            ${switchBody.trim()}
        }`
    }
    return unindent(`{
        ${body}
    }`)
}

function genBaseFlatUnionWriter(
    g: Gen,
    union: ast.UnionType<ast.BaseType | ast.VoidType>,
): string {
    if (!ast.haveDistinctTypeof(union.types)) {
        throw new Error("all types should have distinct typeof values.")
    } // every typeof value is unique => this discriminates the union
    let switchBody = ""
    let defaultCase = ""
    for (let i = 0; i < union.types.length; i++) {
        const tagVal = union.props.tags[i].val
        const tagWriter = tagVal < 128 ? "writeU8" : "writeUintSafe"
        const type = union.types[i]
        if (type.tag === "void") {
            defaultCase = `
            default:
                bare.${tagWriter}(bc, ${tagVal})
                break`
        } else {
            const valWriting = genWriting(g, type, "$x")
            switchBody += `
            case "${ast.BASE_TAG_TO_TYPEOF[type.tag]}":
                bare.${tagWriter}(bc, ${tagVal})
                ${indent(valWriting, 4)}
                break`
        }
    }
    return unindent(`{
        switch (typeof $x) {
            ${switchBody.trim() + defaultCase}
        }
    }`)
}

function genTaggedUnionWriter(g: Gen, type: ast.UnionType): string {
    const tagWriter =
        max(type.props.tags.map((v) => v.val)) < 128
            ? "writeU8"
            : "writeUintSafe"
    const tagPropAccess = g.config.useQuotedProperty ? '["tag"]' : ".tag"
    const valProp = g.config.useQuotedProperty ? '["val"]' : ".val"
    let switchBody = ""
    for (let i = 0; i < type.types.length; i++) {
        if (type.types[i].tag !== "void") {
            const valWriting = genWriting(g, type.types[i], `$x${valProp}`)
            switchBody += `
            case ${type.props.tags[i].val}:
                ${indent(valWriting, 4)}
                break`
        }
    }
    return unindent(`{
        bare.${tagWriter}(bc, $x.tag)
        switch ($x${tagPropAccess}) {
            ${switchBody.trim()}
        }
    }`)
}

// decode

function genDecoder(g: Gen, alias: string): string {
    const config = g.config.importConfig ? `ext.config` : "config"
    return unindent(`${genDecoderHead(g, alias)} {
        const bc = new bare.ByteCursor(bytes, ${config})
        const result = read${alias}(bc)
        if (bc.offset < bc.view.byteLength) {
            throw new bare.BareError(bc.offset, "remaining bytes")
        }
        return result
    }`)
}

// encode

function genEncoder(g: Gen, alias: string): string {
    const config = g.config.importConfig ? `ext.config` : "config"
    return unindent(`${genEncoderHead(g, alias)} {
        const bc = new bare.ByteCursor(
            new Uint8Array(${config}.initialBufferLength),
            ${config}
        )
        write${alias}(bc, x)
        return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
    }`)
}

// utils

function capitalize(s: string): string {
    return s.replace(/^\w/, (c) => c.toUpperCase())
}

function indent(s: string, n = 1): string {
    return s.replace(/\n/g, "\n" + "    ".repeat(n))
}

function unindent(s: string, n = 1): string {
    return s.replace(new RegExp(`\n[ ]{${4 * n}}`, "g"), "\n")
}

function literalValRepr(l: ast.LiteralVal): string {
    switch (l.type) {
        case "bigint":
            return rpr(BigInt(l.val))
        case "false":
        case "null":
        case "true":
        case "undefined":
            return l.type
        case "number":
        case "string":
            return rpr(l.val)
    }
}

function rpr(v: ast.Literal): string {
    return typeof v === "string"
        ? `"${v}"`
        : typeof v === "bigint"
        ? `${v}n`
        : `${v}`
}

/**
 * @param s identifier
 * @returns valid JS identifier
 */
function jsId(s: string): string {
    return JS_RESERVED_WORD.indexOf(s) !== -1 ? "_" + s : s
}

function max(vals: readonly number[]): number {
    return Math.max(...vals)
}

const JS_RESERVED_WORD: readonly string[] =
    `await break case catch class const continue debugger default delete do else
    enum export extends false finally for function if implements import in
    instance interface of new null package private protected public return super
    switch this throw true try typeof var void while with yield`.split(/\s+/g)
