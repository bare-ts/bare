import type {
    AliasedBareType,
    BareAlias,
    BareArray,
    BareAst,
    BareData,
    BareEnum,
    BareLiteral,
    BareMap,
    BareOptional,
    BareSet,
    BareStruct,
    BareType,
    BareTypedArray,
    BareUnion,
} from "../ast/bare-ast.js"
import * as BareAst_ from "../ast/bare-ast.js"
import { BareConfigError } from "./bare-config-error.js"
import { CodeGenConfig } from "./code-gen-config.js"

export function generate(ast: BareAst, config: Partial<CodeGenConfig>): string {
    const g: CodeGen = CodeGen(ast, config)
    checkConfig(g) // may throw
    let body = ""
    for (const aliased of ast) {
        const { alias, exported } = aliased
        switch (g.config.generator) {
            case "dts":
                if (exported) {
                    body += `${genAliasedType(g, aliased)}\n\n`
                    body += `${genAliasedDecoderHead(g, aliased)}\n\n`
                    body += `${genAliasedEncoderHead(g, aliased)}\n\n`
                }
                break
            case "js": {
                const code = genCode(g, aliased)
                body += code !== "" ? code + "\n\n" : ""
                body += `${genAliasedDecoder(g, aliased)}\n\n`
                body += `${genAliasedEncoder(g, aliased)}\n\n`
                break
            }
            case "ts":
                if (exported) {
                    body += `${genAliasedType(g, aliased)}\n\n`
                }
                body += `${genAliasedDecoder(g, aliased)}\n\n`
                body += `${genAliasedEncoder(g, aliased)}\n\n`
                break
        }
        if (g.config.main.indexOf(alias) !== -1) {
            const aliasT = { tag: "alias", props: { alias } } as const
            const pack = genPacker(g, aliasT, `pack${alias}`)
            const packType = genPackerHead(g, aliasT, `pack${alias}`)
            const unpack = genUnpacker(g, aliasT, `unpack${alias}`)
            const unpackType = genUnpackerHead(g, aliasT, `unpack${alias}`)
            switch (g.config.generator) {
                case "dts":
                    body += `export ${packType}\n\n`
                    body += `export ${unpackType}\n\n`
                    break
                case "js":
                case "ts":
                    body += `export ${pack}\n\n`
                    body += `export ${unpack}\n\n`
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
            g.config.main.length !== 0 // packer/unpacker import values
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
        head += "\nconst config = bare.Config({})\n"
    }
    if (g.config.generator !== "js") {
        head += unindent(
            `
            export type f32 = number
            export type f64 = number
            export type i8 = number
            export type i16 = number
            export type i32 = number
            export type i64 = bigint
            export type i64Safe = number
            export type int = bigint
            export type intSafe = number
            export type u8 = number
            export type u16 = number
            export type u32 = number
            export type u64 = bigint
            export type u64Safe = number
            export type uint = bigint
            export type uintSafe = number`,
            3
        )
    }
    return head + "\n\n" + body.slice(0, -1) // remove last newline
}

interface CodeGen {
    readonly aliasToAliased: ReadonlyMap<string, AliasedBareType>
    readonly typeToAliased: ReadonlyMap<BareType, AliasedBareType>
    readonly config: CodeGenConfig
}

function CodeGen(ast: BareAst, partConfig: Partial<CodeGenConfig>): CodeGen {
    return {
        aliasToAliased: BareAst_.aliasToAliased(ast),
        typeToAliased: BareAst_.typeToAliased(ast),
        config: CodeGenConfig(partConfig),
    }
}

function checkConfig(g: CodeGen): void {
    for (const alias of g.config.main) {
        const aliased = g.aliasToAliased.get(alias)
        if (aliased === undefined) {
            throw new BareConfigError(`main codec '${alias}' does not exist`)
        }
        if (!aliased.exported) {
            throw new BareConfigError(`A main codec must be exported`)
        }
    }
}

// TS type generation

function genAliasedType(g: CodeGen, { alias, type }: AliasedBareType): string {
    switch (type.tag) {
        case "enum":
            return "export " + genAliasedEnumType(g, alias, type)
        case "struct": {
            if (g.config.importFactory) {
                const extType = `ReturnType<typeof ext.${alias}>`
                return `export type ${alias} = ${extType}`
            }
            return `export interface ${alias} ${genStructType(g, type)}`
        }
    }
    return `export type ${alias} = ${genType(g, type)}`
}

function typeAliasOrDef(g: CodeGen, type: BareType): string {
    const aliased = g.typeToAliased.get(type)
    return aliased !== undefined && aliased.exported
        ? aliased.alias
        : genType(g, type)
}

function namespaced(g: CodeGen, alias: string): string {
    return g.aliasToAliased.get(alias) !== undefined ? "" : "ext."
}

function genType(g: CodeGen, type: BareType): string {
    switch (type.tag) {
        case "alias":
            return genAliasType(g, type)
        case "array":
            return genArrayType(g, type)
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
        case "typedArray":
            return genTypedArrayType(g, type)
        case "union":
            return genUnionType(g, type)
        case "void":
            return "undefined"
    }
}

function genAliasType(g: CodeGen, { props: { alias } }: BareAlias): string {
    const aliased = g.aliasToAliased.get(alias)
    if (aliased !== undefined && !aliased.exported) {
        return genType(g, aliased.type) // inline a non-exported aliased type
    }
    return `${namespaced(g, alias)}${alias}`
}

function genArrayType(g: CodeGen, { props }: BareArray): string {
    const valTypedef = genType(g, props.valType)
    return props.mutable ? `${valTypedef}[]` : `readonly (${valTypedef})[]`
}

function genEnumType(_g: CodeGen, { props }: BareEnum): string {
    const { useName, vals } = props
    return vals.map(({ name, val }) => (useName ? name : `${val}`)).join(" | ")
}

function genAliasedEnumType(g: CodeGen, alias: string, type: BareEnum): string {
    const {
        props: { useName, vals },
    } = type
    let body = ""
    let defaultVal = 0
    let usedName = false
    for (const { name, val } of vals) {
        if (useName) {
            usedName = true
            body += `${name} = "${name}",\n`
        } else if (!usedName && defaultVal === val) {
            body += `${name},\n`
            defaultVal++
        } else {
            body += `${name} = ${val},\n`
            defaultVal = val + 1
        }
    }
    body = body.slice(0, -1) // remove last newline
    return unindent(`enum ${alias} {
        ${indent(body, 2)}
    }`)
}

function genOptionalType(g: CodeGen, { props }: BareOptional): string {
    const typedef = genType(g, props.type)
    const optionalValue = props.permissive
        ? "undefined | null"
        : props.null
        ? "null"
        : "undefined"
    return `${typedef} | ${optionalValue}`
}

function genLiteralType(_g: CodeGen, { props }: BareLiteral): string {
    return typeof props.val === "string" ? `"${props.val}"` : `${props.val}`
}

function genMapType(g: CodeGen, { props }: BareMap): string {
    const genKeyType = genType(g, props.keyType)
    const genValType = genType(g, props.valType)
    const mapType = props.mutable ? "Map" : "ReadonlyMap"
    return `${mapType}<${genKeyType}, ${genValType}>`
}

function genSetType(g: CodeGen, { props }: BareSet): string {
    const typedef = genType(g, props.valType)
    const setType = props.mutable ? "Set" : "ReadonlySet"
    return `${setType}<${typedef}>`
}

function genStructType(g: CodeGen, { props }: BareStruct): string {
    const lines = props.fields.map(
        ({ mutable, name, type }) =>
            `${mutable ? "" : "readonly "}${name}: ${genType(g, type)}`
    )
    return unindent(`{
        ${indent(lines.join("\n"), 2)}
    }`)
}

function genTypedArrayType(_g: CodeGen, { props }: BareTypedArray): string {
    return {
        i8: "Int8Array",
        i16: "Int16Array",
        i32: "Int32Array",
        i64: "BigInt64Array",
        u8: "Uint8Array",
        u8Clamped: "Uint8ClampedArray",
        u16: "Uint16Array",
        u32: "Uint32Array",
        u64: "BigUint64Array",
    }[props.valTypeName]
}

function genUnionType(g: CodeGen, { props }: BareUnion): string {
    let result = ""
    for (const { tagVal, type } of props.units) {
        const valType = genType(g, type)
        result += props.flat
            ? `\n| ${valType}`
            : `\n| { readonly tag: ${tagVal}; readonly val: ${valType} }`
    }
    return indent(result)
}

function genAliasedDecoderHead(g: CodeGen, aliased: AliasedBareType): string {
    return "export " + genDecoderHead(g, aliased.type, `decode${aliased.alias}`)
}

function genDecoderHead(g: CodeGen, type: BareType, id: string): string {
    const rType = typeAliasOrDef(g, type)
    return g.config.generator === "js"
        ? `function ${id}(bc)`
        : `function ${id}(bc: bare.ByteCursor): ${rType}`
}

function genAliasedEncoderHead(g: CodeGen, aliased: AliasedBareType): string {
    return "export " + genEncoderHead(g, aliased.type, `encode${aliased.alias}`)
}

function genEncoderHead(g: CodeGen, type: BareType, id: string): string {
    const xType = typeAliasOrDef(g, type)
    return g.config.generator === "js"
        ? `function ${id}(bc, x)`
        : `function ${id}(bc: bare.ByteCursor, x: ${xType}): void`
}

function genPackerHead(g: CodeGen, type: BareType, id: string): string {
    const xType = typeAliasOrDef(g, type)
    return g.config.generator === "js"
        ? `function ${id}(x)`
        : `function ${id}(x: ${xType}): Uint8Array`
}

function genUnpackerHead(g: CodeGen, type: BareType, id: string): string {
    const rType = typeAliasOrDef(g, type)
    return g.config.generator === "js"
        ? `function ${id}(bytes)`
        : `function ${id}(bytes: ArrayBuffer | Uint8Array): ${rType}`
}

// JS/TS code

function genCode(g: CodeGen, aliased: AliasedBareType): string {
    const { alias, exported, type } = aliased
    if (type.tag === "enum") {
        return (exported ? "export " : "") + genAliasedEnumCode(g, alias, type)
    }
    return ""
}

function genAliasedEnumCode(g: CodeGen, alias: string, type: BareEnum): string {
    if (g.config.generator !== "js") {
        return ""
    }
    const body = type.props.vals
        .map(({ name, val }) =>
            type.props.useName
                ? `${name}: "${name}"`
                : `${name}: ${val},\n${val}: "${name}"`
        )
        .join(",\n")
    const constAssert = g.config.generator !== "js" ? "as const" : ""
    return unindent(`const ${alias} = {
        ${indent(body, 2)}
    }${constAssert}`)
}

// JS/TS decoder generation

function genAliasedDecoder(g: CodeGen, aliased: AliasedBareType): string {
    const decoder = genDecoder(g, aliased.type, `decode${aliased.alias}`)
    const statement = decoder.startsWith("function")
        ? decoder
        : `const decode${aliased.alias} = ${decoder}`
    return (aliased.exported ? "export " : "") + statement
}

function genDecoder(g: CodeGen, type: BareType, id = ""): string {
    switch (type.tag) {
        case "alias":
            return `${namespaced(g, type.props.alias)}decode${type.props.alias}`
        case "array":
            return genArrayDecoder(g, type, id)
        case "bool":
        case "f32":
        case "f64":
        case "i8":
        case "i16":
        case "i32":
        case "i64":
        case "i64Safe":
        case "int":
        case "intSafe":
        case "string":
        case "u8":
        case "u16":
        case "u32":
        case "u64":
        case "u64Safe":
        case "uint":
        case "uintSafe":
        case "void":
            return `bare.decode${capitalize(type.tag)}`
        case "data":
            return genDataDecoder(g, type, id)
        case "enum":
            return genEnumDecoder(g, type, id)
        case "literal":
            return genLiteralDecoder(g, type, id)
        case "map":
            return genMapDecoder(g, type, id)
        case "optional":
            return genOptionalDecoder(g, type, id)
        case "set":
            return genSetDecoder(g, type, id)
        case "struct":
            return genStructDecoder(g, type, id)
        case "typedArray":
            return genTypedArrayDecoder(g, type, id)
        case "union":
            return genUnionDecoder(g, type, id)
    }
}

function genArrayDecoder(g: CodeGen, type: BareArray, id: string): string {
    const valDecoder = genDecoder(g, type.props.valType)
    const lenDecoding =
        type.props.len != null
            ? `${type.props.len}`
            : `bare.decodeUintSafe(bc)\nif (len === 0) return []`
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        const len = ${indent(lenDecoding, 2)}
        const valDecoder = ${indent(valDecoder, 2)}
        const result = [valDecoder(bc)]
        for (let i = 1; i < len; i++) {
            result[i] = valDecoder(bc)
        }
        return result
    }`)
}

function genDataDecoder(g: CodeGen, type: BareData, id: string): string {
    if (type.props.len == null) {
        return `bare.decodeData`
    }
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        return bare.decodeFixedData(bc, ${type.props.len})
    }`)
}

function genEnumDecoder(g: CodeGen, type: BareEnum, id: string): string {
    const {
        props: { useName, vals },
    } = type
    const rType = typeAliasOrDef(g, type)
    const aliased = g.typeToAliased.get(type)
    const lastTag = vals[vals.length - 1].val
    const tagDecoder = lastTag < 128 ? "bare.decodeU8" : "bare.decodeSafeUint"
    const signature = genDecoderHead(g, type, id)
    if (!useName && lastTag === vals.length - 1) {
        const typeAssert = g.config.generator === "js" ? "" : ` as ${rType}`
        return unindent(
            `${signature} {
                const offset = bc.offset
                const tag = ${tagDecoder}(bc)
                if (tag > ${lastTag}) {
                    bc.offset = offset
                    throw new bare.BareError(offset, "invalid tag")
                }
                return tag${typeAssert}
            }`,
            3
        )
    }
    let switchBody = ""
    for (const { name, val } of vals) {
        const enumVal =
            aliased !== undefined
                ? `${aliased.alias}.${name}`
                : useName
                ? `"${name}"`
                : val
        switchBody += `
        case ${val}:
            return ${enumVal}`
    }
    return unindent(`${signature} {
        const offset = bc.offset
        const tag = ${tagDecoder}(bc)
        switch (tag) {
            ${indent(switchBody.trim())}
            default: {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
        }
    }`)
}

function genLiteralDecoder(g: CodeGen, type: BareLiteral, id: string): string {
    const val = type.props.val
    const rVal = typeof val === "string" ? `"${val}"` : `${val}`
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        return ${rVal}
    }`)
}

function genMapDecoder(g: CodeGen, type: BareMap, id: string): string {
    const { props } = type
    const kType = typeAliasOrDef(g, props.keyType)
    const vType = typeAliasOrDef(g, props.valType)
    const MapGenerics =
        g.config.generator === "js"
            ? ""
            : `<${indent(kType, 2)}, ${indent(vType, 2)}>`
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        const len = bare.decodeUintSafe(bc)
        const result = new Map${MapGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const key = (${indent(genDecoder(g, props.keyType), 2)})(bc)
            if (result.has(key)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated key")
            }
            result.set(key, (${indent(genDecoder(g, props.valType), 2)})(bc))
        }
        return result
    }`)
}

function genOptionalDecoder(
    g: CodeGen,
    type: BareOptional,
    id: string
): string {
    const noneVal = type.props.null ? "null" : "undefined"
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        return bare.decodeBool(bc)
            ? (${indent(genDecoder(g, type.props.type), 3)})(bc)
            : ${noneVal}
    }`)
}

function genSetDecoder(g: CodeGen, type: BareSet, id: string): string {
    const valType = type.props.valType
    const SetGenerics =
        g.config.generator === "js"
            ? ""
            : `<${indent(typeAliasOrDef(g, valType), 2)}>`
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        const len = bare.decodeUintSafe(bc)
        const result = new Set${SetGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const val = (${indent(genDecoder(g, valType), 2)})(bc)
            if (result.has(val)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated value")
            }
            result.add(val)
        }
        return result
    }`)
}

function genStructDecoder(g: CodeGen, type: BareStruct, id: string): string {
    let fieldInit = ""
    let objBody = ""
    let factoryArgs = ""
    for (const field of type.props.fields) {
        const fieldDecoder = genDecoder(g, field.type)
        if (
            JS_RESERVED_WORD.indexOf(field.name) !== -1 ||
            /^(assert|bare|bc|ext|x)$|^decode/.test(field.name)
        ) {
            fieldInit += `const _${field.name} = (${fieldDecoder})(bc)\n`
            objBody += `\n${field.name}: _${field.name},`
            factoryArgs += `_${field.name},`
        } else {
            fieldInit += `const ${field.name} = (${fieldDecoder})(bc)\n`
            objBody += `\n${field.name},`
            factoryArgs += `${field.name},`
        }
    }
    factoryArgs = factoryArgs.slice(0, -1) // remove extra coma
    let objCreation: string
    const alias = g.typeToAliased.get(type)?.alias
    if (g.config.importFactory && alias !== undefined) {
        objCreation = `ext.${alias}(${indent(factoryArgs)})`
    } else {
        objCreation = `{${indent(objBody)}\n}`
    }
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        ${indent(fieldInit.trim(), 2)}
        return ${indent(objCreation, 2)}
    }`)
}

function genTypedArrayDecoder(
    g: CodeGen,
    type: BareTypedArray,
    id: string
): string {
    const { props } = type
    const typeName = capitalize(props.valTypeName)
    if (props.len == null) {
        return `bare.decode${typeName}Array`
    }
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        return bare.decode${typeName}FixedArray(bc, ${props.len})
    }`)
}

function genUnionDecoder(g: CodeGen, type: BareUnion, id: string): string {
    const lastTag = type.props.units[type.props.units.length - 1].tagVal
    const tagDecoder = lastTag < 128 ? "bare.decodeU8" : "bare.decodeSafeUint"
    const flatten = type.props.flat
    let switchBody = ""
    for (const enumVal of type.props.units) {
        const decoder = genDecoder(g, enumVal.type)
        if (flatten) {
            switchBody += `
            case ${enumVal.tagVal}:
                return (${decoder})(bc)`
        } else {
            switchBody += `
            case ${enumVal.tagVal}: {
                const val = (${decoder})(bc)
                return { tag, val }
            }`
        }
    }
    return unindent(`${indent(genDecoderHead(g, type, id))} {
        const offset = bc.offset
        const tag = ${tagDecoder}(bc)
        switch (tag) {
            ${switchBody.trim()}
            default: {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
        }
    }`)
}

// JS/TS encoders generation

function genAliasedEncoder(g: CodeGen, aliased: AliasedBareType): string {
    const encoder = genEncoder(g, aliased.type, `encode${aliased.alias}`)
    const statement = encoder.startsWith("function")
        ? encoder
        : `const encode${aliased.alias} = ${encoder}`
    return (aliased.exported ? "export " : "") + statement
}

function genEncoder(g: CodeGen, type: BareType, id = ""): string {
    switch (type.tag) {
        case "alias":
            return `${namespaced(g, type.props.alias)}encode${type.props.alias}`
        case "array":
            return genArrayEncoder(g, type, id)
        case "bool":
        case "f32":
        case "f64":
        case "i8":
        case "i16":
        case "i32":
        case "i64":
        case "i64Safe":
        case "int":
        case "intSafe":
        case "string":
        case "u8":
        case "u16":
        case "u32":
        case "u64":
        case "u64Safe":
        case "uint":
        case "uintSafe":
        case "void":
            return `bare.encode${capitalize(type.tag)}`
        case "data":
            return genDataEncoder(g, type, id)
        case "enum":
            return genEnumEncoder(g, type, id)
        case "literal":
            return genLiteralEncoder(g, type, id)
        case "map":
            return genMapEncoder(g, type, id)
        case "optional":
            return genOptionalEncoder(g, type, id)
        case "set":
            return genSetEncoder(g, type, id)
        case "struct":
            return genStructEncoder(g, type, id)
        case "typedArray":
            return genTypedArrayEncoder(g, type, id)
        case "union":
            return genUnionEncoder(g, type, id)
    }
}

function genArrayEncoder(g: CodeGen, type: BareArray, id: string): string {
    const lenEncoding =
        type.props.len != null
            ? `assert(x.length === ${type.props.len}, "Unmatched length")`
            : `bare.encodeUintSafe(bc, x.length)`
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        ${lenEncoding}
        for (let i = 0; i < x.length; i++) {
            (${indent(genEncoder(g, type.props.valType), 2)})(bc, x[i])
        }
    }`)
}

function genDataEncoder(g: CodeGen, type: BareData, id: string): string {
    if (type.props.len == null) {
        return `bare.encodeData`
    }
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        bare.encodeFixedData(bc, x, ${type.props.len})
    }`)
}

function genEnumEncoder(g: CodeGen, type: BareEnum, id: string): string {
    const {
        props: { useName, vals },
    } = type
    const aliased = g.typeToAliased.get(type)
    const lastTag = vals[vals.length - 1].val
    const tagEncoder = lastTag < 128 ? "bare.encodeU8" : "bare.encodeSafeUint"
    const signature = genEncoderHead(g, type, id)
    if (!useName) {
        return unindent(
            `${signature} {
            ${tagEncoder}(bc, x)
        }`,
            2
        )
    }
    let switchBody = ""
    for (const { name, val } of vals) {
        const enumVal =
            aliased !== undefined
                ? `${aliased.alias}.${name}`
                : useName
                ? `"${name}"`
                : val
        switchBody += `
        case ${enumVal}: {
            ${tagEncoder}(bc, ${val})
            break
        }`
    }
    return unindent(`${indent(signature)} {
        switch (x) {
            ${indent(switchBody.trim())}
        }
    }`)
}

function genLiteralEncoder(g: CodeGen, type: BareLiteral, id: string): string {
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        // do nothing
    }`)
}

function genMapEncoder(g: CodeGen, type: BareMap, id: string): string {
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        bare.encodeUintSafe(bc, x.size)
        for(const kv of x) {
            (${indent(genEncoder(g, type.props.keyType), 2)})(bc, kv[0]);
            (${indent(genEncoder(g, type.props.valType), 2)})(bc, kv[1])
        }
    }`)
}

function genOptionalEncoder(
    g: CodeGen,
    type: BareOptional,
    id: string
): string {
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        bare.encodeBool(bc, x != null)
        if (x != null) {
            (${indent(genEncoder(g, type.props.type), 3)})(bc, x)
        }
    }`)
}

function genSetEncoder(g: CodeGen, type: BareSet, id: string): string {
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        bare.encodeUintSafe(bc, x.size)
        for (const v of x) {
            (${indent(genEncoder(g, type.props.valType), 2)})(bc, v)
        }
    }`)
}

function genStructEncoder(g: CodeGen, type: BareStruct, id: string): string {
    const fieldEncoding = type.props.fields.map(
        ({ name, type }) => `(${genEncoder(g, type)})(bc, x.${name});`
    )
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        ${indent(fieldEncoding.join("\n"), 2)}
    }`)
}

function genTypedArrayEncoder(
    g: CodeGen,
    type: BareTypedArray,
    id: string
): string {
    const { len, valTypeName } = type.props
    if (len == null) {
        return `bare.encode${capitalize(valTypeName)}Array`
    }
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        return bare.encode${capitalize(valTypeName)}FixedArray(bc, x, ${len})
    }`)
}

function genUnionEncoder(g: CodeGen, type: BareUnion, id: string): string {
    const xType = typeAliasOrDef(g, type)
    const lastTag = type.props.units[type.props.units.length - 1].tagVal
    const tagEncoder = lastTag < 128 ? "bare.encodeU8" : "bare.encodeSafeUint"
    const tagExp = type.props.flat ? `ext.tag${xType}(x)` : "x.tag"
    const valExp = type.props.flat
        ? g.config.generator === "ts"
            ? "x as any"
            : "x"
        : "x.val"
    let switchBody = ""
    for (const enumVal of type.props.units) {
        switchBody += `
        case ${enumVal.tagVal}:
            (${genEncoder(g, enumVal.type)})(bc, ${valExp})
            break`
    }
    return unindent(`${indent(genEncoderHead(g, type, id))} {
        const tag = ${tagExp};
        ${tagEncoder}(bc, tag)
        switch (tag) {
            ${indent(switchBody.trim())}
        }
    }`)
}

// pack

function genPacker(g: CodeGen, type: BareType, id: string): string {
    const config = g.config.importConfig ? `ext.config` : "config"
    return unindent(`${genPackerHead(g, type, id)} {
        const bc = new bare.ByteCursor(
            new ArrayBuffer(${config}.initialBufferLength),
            ${config}
        )
        ${indent(genEncoder(g, type), 2)}(bc, x)
        return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
    }`)
}

// function genPackerInto(g: CodeGen, type: BareType, id: string): string {
//     const config = g.config.importConfig ? `ext.config` : "config"
//     return unindent(`function ${id}(x/*: ${indent(
//         typeAliasOrDef(g, type)
//     )}*/, into/*: ArrayBuffer | Uint8Array*/)/*: Uint8Array*/ {
//         const newConfig = bare.Config(${config})
//         // Set config to prevent allocation of a new buffer
//         Object.assign(newConfig, { maxBufferLength: into.length })
//         const bc = new bare.ByteCursor(into, newConfig)
//         ${indent(genEncoder(g, type), 2)}(bc, x)
//         return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
//     }`)
// }

// unpack

function genUnpacker(g: CodeGen, type: BareType, id: string): string {
    const config = g.config.importConfig ? `ext.config` : "config"
    return unindent(`${genUnpackerHead(g, type, id)} {
        const bc = new bare.ByteCursor(bytes, ${config})
        const result = ${indent(genDecoder(g, type), 2)}(bc)
        if (bc.offset < bc.view.byteLength) {
            throw new bare.BareError(bc.offset, "remaining bytes")
        }
        return result
    }`)
}

// function genUnpackerStream(g: CodeGen, type: BareType, id: string): string {
//     const decoder = genDecoder(g, type)
//     const rType = typeAliasOrDef(g, type)
//     const config = g.config.importConfig ? `ext.config` : "config"
//     return unindent(`function* ${id}(bytes/*: ArrayBuffer | Uint8Array*/)/*: Generator<${indent(
//         rType
//     )}>*/ {
//         const bc = new bare.ByteCursor(bytes, ${config})
//         while (bc.offset < bc.view.byteLength) {
//             yield ${indent(decoder, 2)}(bc)
//         }
//     }`)
// }

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

const JS_RESERVED_WORD: readonly string[] =
    `await break case catch class const continue debugger default delete do else
    enum export extends false finally for function if implements import in
    instance interface of new null package private protected public return super
    switch this throw true try typeof var void while with yield`.split(/\s+/g)
