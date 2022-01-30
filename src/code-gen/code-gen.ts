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
import { Config, ConfigError } from "../core/config.js"

export function generate(ast: BareAst, config: Partial<Config> = {}): string {
    const g = CodeGen(ast, Config(config))
    checkConfig(g) // may throw
    let body = ""
    for (const aliased of ast) {
        const { alias, exported } = aliased
        switch (g.config.generator) {
            case "dts":
                if (exported) {
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
            case "ts":
                if (exported) {
                    const aliasedType = genAliasedType(g, aliased)
                    body += aliasedType !== "" ? aliasedType + "\n\n" : ""
                }
                const code = genCode(g, aliased)
                body += code !== "" ? code + "\n\n" : ""
                body += `${genAliasedReader(g, aliased)}\n\n`
                body += `${genAliasedWriter(g, aliased)}\n\n`
                break
        }
        if (g.config.main.indexOf(alias) !== -1) {
            const aliasT = { tag: "alias", props: { alias } } as const
            const encode = genEncoder(g, aliasT, alias)
            const encodeType = genEncoderHead(g, aliasT, alias)
            const decode = genDecoder(g, aliasT, alias)
            const decodeType = genDecoderHead(g, aliasT, alias)
            switch (g.config.generator) {
                case "dts":
                    body += `export ${encodeType}\n\n`
                    body += `export ${decodeType}\n\n`
                    break
                case "js":
                case "ts":
                    body += `export ${encode}\n\n`
                    body += `export ${decode}\n\n`
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
    readonly config: Config
}

function CodeGen(ast: BareAst, config: Config): CodeGen {
    return {
        aliasToAliased: BareAst_.aliasToAliased(ast),
        config,
    }
}

function checkConfig(g: CodeGen): void {
    for (const alias of g.config.main) {
        const aliased = g.aliasToAliased.get(alias)
        if (aliased === undefined) {
            throw new ConfigError(`Main codec '${alias}' does not exist.`)
        }
        if (!aliased.exported) {
            throw new ConfigError(`A main codec must be exported.`)
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
                4
            )
        }
    }
    return `export type ${alias} = ${genType(g, type)}`
}

function typeAliasOrDef(g: CodeGen, type: BareType, alias: string): string {
    const aliased = g.aliasToAliased.get(alias)
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
    const modifier = g.config.generator === "dts" ? "declare " : ""
    return unindent(`${modifier}enum ${alias} {
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

function genStructType(g: CodeGen, type: BareStruct): string {
    return unindent(`{
        ${indent(genStructTypeBody(g, type), 2)}
    }`)
}

function genStructTypeBody(g: CodeGen, type: BareStruct): string {
    const members = type.props.fields.map(
        ({ mutable, name, type }) =>
            `${mutable ? "" : "readonly "}${name}: ${genType(g, type)}`
    )
    return members.join("\n")
}

function genStructTypeClassBody(g: CodeGen, type: BareStruct): string {
    const params = type.props.fields
        .map(({ name, type }) => `${jsIdFrom(name)}: ${genType(g, type)},`)
        .join("\n")
    return unindent(
        `${indent(genStructTypeBody(g, type), 2)}
        constructor(
            ${indent(params, 3)}
        )`,
        2
    )
}

function genTypedArrayType(_g: CodeGen, { props }: BareTypedArray): string {
    return BareAst_.TYPED_ARRAY_VAL_TYPE_TO_ARRAY[props.valTypeName]
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

function genAliasedReaderHead(g: CodeGen, aliased: AliasedBareType): string {
    return "export " + genReaderHead(g, aliased.type, `${aliased.alias}`)
}

function genReaderHead(g: CodeGen, type: BareType, alias: string): string {
    const rType = typeAliasOrDef(g, type, alias)
    const fname = alias !== "" ? `read${alias}` : ""
    return g.config.generator === "js"
        ? `function ${fname}(bc)`
        : `function ${fname}(bc: bare.ByteCursor): ${rType}`
}

function genAliasedWriterHead(g: CodeGen, aliased: AliasedBareType): string {
    return "export " + genWriterHead(g, aliased.type, `${aliased.alias}`)
}

function genWriterHead(g: CodeGen, type: BareType, alias: string): string {
    const xType = typeAliasOrDef(g, type, alias)
    const fname = alias !== "" ? `write${alias}` : ""
    return g.config.generator === "js"
        ? `function ${fname}(bc, x)`
        : `function ${fname}(bc: bare.ByteCursor, x: ${xType}): void`
}

function genDecoderHead(g: CodeGen, type: BareType, alias: string): string {
    const rType = typeAliasOrDef(g, type, alias)
    const fname = alias !== "" ? `decode${alias}` : ""
    return g.config.generator === "js"
        ? `function ${fname}(bytes)`
        : `function ${fname}(bytes: Uint8Array): ${rType}`
}

function genEncoderHead(g: CodeGen, type: BareType, alias: string): string {
    const xType = typeAliasOrDef(g, type, alias)
    const fname = alias !== "" ? `encode${alias}` : ""
    return g.config.generator === "js"
        ? `function ${fname}(x)`
        : `function ${fname}(x: ${xType}): Uint8Array`
}

// JS/TS code

function genCode(g: CodeGen, aliased: AliasedBareType): string {
    const { alias, exported, type } = aliased
    if (type.tag === "enum" && g.config.generator === "js") {
        return (exported ? "export " : "") + genAliasedEnumCode(g, alias, type)
    }
    if (
        type.tag === "struct" &&
        type.props.class &&
        aliased.exported &&
        !g.config.importFactory
    ) {
        return (
            (exported ? "export " : "") + genAliasedStructCode(g, alias, type)
        )
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

function genAliasedStructCode(
    g: CodeGen,
    alias: string,
    type: BareStruct
): string {
    const ts = g.config.generator === "ts"
    const members = ts ? "\n" + genStructTypeBody(g, type) : ""
    const params = type.props.fields
        .map(
            ({ name, type }) =>
                `${jsIdFrom(name)}` + (ts ? `: ${genType(g, type)},` : ",")
        )
        .join("\n")
    const assignments = type.props.fields
        .map(({ name }) => `this.${name} = ${jsIdFrom(name)}`)
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

function genAliasedReader(g: CodeGen, aliased: AliasedBareType): string {
    const reader = genReader(g, aliased.type, `${aliased.alias}`)
    const statement = reader.startsWith("function")
        ? reader
        : `const read${aliased.alias} = ${reader}`
    return (aliased.exported ? "export " : "") + statement
}

function genReader(g: CodeGen, type: BareType, alias = ""): string {
    switch (type.tag) {
        case "alias":
            return `${namespaced(g, type.props.alias)}read${type.props.alias}`
        case "array":
            return genArrayReader(g, type, alias)
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
            return `bare.read${capitalize(type.tag)}`
        case "data":
            return genDataReader(g, type, alias)
        case "enum":
            return genEnumReader(g, type, alias)
        case "literal":
            return genLiteralReader(g, type, alias)
        case "map":
            return genMapReader(g, type, alias)
        case "optional":
            return genOptionalReader(g, type, alias)
        case "set":
            return genSetReader(g, type, alias)
        case "struct":
            return genStructReader(g, type, alias)
        case "typedArray":
            return genTypedArrayReader(g, type, alias)
        case "union":
            return genUnionReader(g, type, alias)
    }
}

function genArrayReader(g: CodeGen, type: BareArray, alias = ""): string {
    const valReader = genReader(g, type.props.valType)
    const lenDecoding =
        type.props.len != null
            ? `${type.props.len}`
            : `bare.readUintSafe(bc)\nif (len === 0) return []`
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        const len = ${indent(lenDecoding, 2)}
        const valReader = ${indent(valReader, 2)}
        const result = [valReader(bc)]
        for (let i = 1; i < len; i++) {
            result[i] = valReader(bc)
        }
        return result
    }`)
}

function genDataReader(g: CodeGen, type: BareData, alias = ""): string {
    if (type.props.len == null) {
        return `bare.readData`
    }
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        return bare.readFixedData(bc, ${type.props.len})
    }`)
}

function genEnumReader(g: CodeGen, type: BareEnum, alias = ""): string {
    const {
        props: { useName, vals },
    } = type
    const rType = typeAliasOrDef(g, type, alias)
    const lastTag = vals[vals.length - 1].val
    const tagReader = lastTag < 128 ? "bare.readU8" : "bare.readUintSafe"
    const signature = genReaderHead(g, type, alias)
    if (!useName && lastTag === vals.length - 1) {
        const typeAssert = g.config.generator === "js" ? "" : ` as ${rType}`
        return unindent(
            `${signature} {
                const offset = bc.offset
                const tag = ${tagReader}(bc)
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
            alias !== "" ? `${alias}.${name}` : useName ? `"${name}"` : val
        switchBody += `
        case ${val}:
            return ${enumVal}`
    }
    return unindent(`${signature} {
        const offset = bc.offset
        const tag = ${tagReader}(bc)
        switch (tag) {
            ${indent(switchBody.trim())}
            default: {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
        }
    }`)
}

function genLiteralReader(g: CodeGen, type: BareLiteral, alias = ""): string {
    const val = type.props.val
    const rVal = typeof val === "string" ? `"${val}"` : `${val}`
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        return ${rVal}
    }`)
}

function genMapReader(g: CodeGen, type: BareMap, alias = ""): string {
    const { props } = type
    const kType = genType(g, props.keyType)
    const vType = genType(g, props.valType)
    const MapGenerics =
        g.config.generator === "js"
            ? ""
            : `<${indent(kType, 2)}, ${indent(vType, 2)}>`
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        const len = bare.readUintSafe(bc)
        const result = new Map${MapGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const key = (${indent(genReader(g, props.keyType), 2)})(bc)
            if (result.has(key)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated key")
            }
            result.set(key, (${indent(genReader(g, props.valType), 2)})(bc))
        }
        return result
    }`)
}

function genOptionalReader(g: CodeGen, type: BareOptional, alias = ""): string {
    const noneVal = type.props.null ? "null" : "undefined"
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        return bare.readBool(bc)
            ? (${indent(genReader(g, type.props.type), 3)})(bc)
            : ${noneVal}
    }`)
}

function genSetReader(g: CodeGen, type: BareSet, alias = ""): string {
    const valType = type.props.valType
    const SetGenerics =
        g.config.generator === "js" ? "" : `<${indent(genType(g, valType), 2)}>`
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        const len = bare.readUintSafe(bc)
        const result = new Set${SetGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const val = (${indent(genReader(g, valType), 2)})(bc)
            if (result.has(val)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated value")
            }
            result.add(val)
        }
        return result
    }`)
}

function genStructReader(g: CodeGen, type: BareStruct, alias = ""): string {
    let fieldInit = ""
    let objBody = ""
    let factoryArgs = ""
    for (const field of type.props.fields) {
        const fieldReader = genReader(g, field.type)
        const name = jsIdFrom(field.name)
        fieldInit += `const ${name} = (${fieldReader})(bc)\n`
        factoryArgs += `${name}, `
        if (field.name === name) {
            objBody += `\n${field.name},`
        } else {
            objBody += `\n${field.name}: ${name},`
        }
    }
    factoryArgs = factoryArgs.slice(0, -2) // remove extra coma and space
    let objCreation: string
    if (g.config.importFactory && alias !== "") {
        objCreation = `ext.${alias}(${indent(factoryArgs)})`
        if (type.props.class) {
            objCreation = `new ` + objCreation
        }
    } else if (
        type.props.class &&
        alias !== "" &&
        g.aliasToAliased.get(alias)?.exported
    ) {
        objCreation = `new ${alias}(${indent(factoryArgs)})`
    } else {
        objCreation = `{${indent(objBody)}\n}`
    }
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        ${indent(fieldInit.trim(), 2)}
        return ${indent(objCreation, 2)}
    }`)
}

function genTypedArrayReader(
    g: CodeGen,
    type: BareTypedArray,
    id = ""
): string {
    const { props } = type
    const typeName = capitalize(props.valTypeName)
    if (props.len == null) {
        return `bare.read${typeName}Array`
    }
    return unindent(`${indent(genReaderHead(g, type, id))} {
        return bare.read${typeName}FixedArray(bc, ${props.len})
    }`)
}

function genUnionReader(g: CodeGen, type: BareUnion, alias = ""): string {
    const lastTag = type.props.units[type.props.units.length - 1].tagVal
    const tagReader = lastTag < 128 ? "bare.readU8" : "bare.readUintSafe"
    const flatten = type.props.flat
    let switchBody = ""
    for (const enumVal of type.props.units) {
        const reader = genReader(g, enumVal.type)
        if (flatten) {
            switchBody += `
            case ${enumVal.tagVal}:
                return (${reader})(bc)`
        } else {
            switchBody += `
            case ${enumVal.tagVal}: {
                const val = (${reader})(bc)
                return { tag, val }
            }`
        }
    }
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        const offset = bc.offset
        const tag = ${tagReader}(bc)
        switch (tag) {
            ${switchBody.trim()}
            default: {
                bc.offset = offset
                throw new bare.BareError(offset, "invalid tag")
            }
        }
    }`)
}

// JS/TS writers generation

function genAliasedWriter(g: CodeGen, aliased: AliasedBareType): string {
    const writer = genWriter(g, aliased.type, `${aliased.alias}`)
    const statement = writer.startsWith("function")
        ? writer
        : `const write${aliased.alias} = ${writer}`
    return (aliased.exported ? "export " : "") + statement
}

function genWriter(g: CodeGen, type: BareType, alias = ""): string {
    switch (type.tag) {
        case "alias":
            return `${namespaced(g, type.props.alias)}write${type.props.alias}`
        case "array":
            return genArrayWriter(g, type, alias)
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
            return `bare.write${capitalize(type.tag)}`
        case "data":
            return genDataWriter(g, type, alias)
        case "enum":
            return genEnumWriter(g, type, alias)
        case "literal":
            return genLiteralWriter(g, type, alias)
        case "map":
            return genMapWriter(g, type, alias)
        case "optional":
            return genOptionalWriter(g, type, alias)
        case "set":
            return genSetWriter(g, type, alias)
        case "struct":
            return genStructWriter(g, type, alias)
        case "typedArray":
            return genTypedArrayWriter(g, type, alias)
        case "union":
            return genUnionWriter(g, type, alias)
    }
}

function genArrayWriter(g: CodeGen, type: BareArray, alias = ""): string {
    const lenEncoding =
        type.props.len != null
            ? `assert(x.length === ${type.props.len}, "Unmatched length")`
            : `bare.writeUintSafe(bc, x.length)`
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        ${lenEncoding}
        for (let i = 0; i < x.length; i++) {
            (${indent(genWriter(g, type.props.valType), 2)})(bc, x[i])
        }
    }`)
}

function genDataWriter(g: CodeGen, type: BareData, alias = ""): string {
    if (type.props.len == null) {
        return `bare.writeData`
    }
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        assert(x.byteLength === ${type.props.len})
        bare.writeFixedData(bc, x)
    }`)
}

function genEnumWriter(g: CodeGen, type: BareEnum, alias = ""): string {
    const {
        props: { useName, vals },
    } = type
    const lastTag = vals[vals.length - 1].val
    const tagWriter = lastTag < 128 ? "bare.writeU8" : "bare.writeUintSafe"
    const signature = genWriterHead(g, type, alias)
    if (!useName) {
        return unindent(
            `${signature} {
            ${tagWriter}(bc, x)
        }`,
            2
        )
    }
    let switchBody = ""
    for (const { name, val } of vals) {
        const enumVal =
            alias !== "" ? `${alias}.${name}` : useName ? `"${name}"` : val
        switchBody += `
        case ${enumVal}: {
            ${tagWriter}(bc, ${val})
            break
        }`
    }
    return unindent(`${indent(signature)} {
        switch (x) {
            ${indent(switchBody.trim())}
        }
    }`)
}

function genLiteralWriter(g: CodeGen, type: BareLiteral, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        // do nothing
    }`)
}

function genMapWriter(g: CodeGen, type: BareMap, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        bare.writeUintSafe(bc, x.size)
        for(const kv of x) {
            (${indent(genWriter(g, type.props.keyType), 2)})(bc, kv[0]);
            (${indent(genWriter(g, type.props.valType), 2)})(bc, kv[1])
        }
    }`)
}

function genOptionalWriter(g: CodeGen, type: BareOptional, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        bare.writeBool(bc, x != null)
        if (x != null) {
            (${indent(genWriter(g, type.props.type), 3)})(bc, x)
        }
    }`)
}

function genSetWriter(g: CodeGen, type: BareSet, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        bare.writeUintSafe(bc, x.size)
        for (const v of x) {
            (${indent(genWriter(g, type.props.valType), 2)})(bc, v)
        }
    }`)
}

function genStructWriter(g: CodeGen, type: BareStruct, alias = ""): string {
    const fieldEncoding = type.props.fields.map(
        ({ name, type }) => `(${genWriter(g, type)})(bc, x.${name});`
    )
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        ${indent(fieldEncoding.join("\n"), 2)}
    }`)
}

function genTypedArrayWriter(
    g: CodeGen,
    type: BareTypedArray,
    id = ""
): string {
    const { len, valTypeName } = type.props
    if (len == null) {
        return `bare.write${capitalize(valTypeName)}Array`
    }
    return unindent(`${indent(genWriterHead(g, type, id))} {
        assert(x.length === ${len})
        return bare.write${capitalize(valTypeName)}FixedArray(bc, x)
    }`)
}

function genUnionWriter(g: CodeGen, type: BareUnion, alias = ""): string {
    const xType = typeAliasOrDef(g, type, alias)
    const lastTag = type.props.units[type.props.units.length - 1].tagVal
    const tagWriter = lastTag < 128 ? "bare.writeU8" : "bare.writeUintSafe"
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
            (${genWriter(g, enumVal.type)})(bc, ${valExp})
            break`
    }
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        const tag = ${tagExp};
        ${tagWriter}(bc, tag)
        switch (tag) {
            ${indent(switchBody.trim())}
        }
    }`)
}

// decode

function genDecoder(g: CodeGen, type: BareType, alias = ""): string {
    const config = g.config.importConfig ? `ext.config` : "config"
    return unindent(`${genDecoderHead(g, type, alias)} {
        const bc = new bare.ByteCursor(bytes, ${config})
        const result = ${indent(genReader(g, type), 2)}(bc)
        if (bc.offset < bc.view.byteLength) {
            throw new bare.BareError(bc.offset, "remaining bytes")
        }
        return result
    }`)
}

// function genDecoderStream(g: CodeGen, type: BareType, id = ""): string {
//     const reader = genReader(g, type)
//     const rType = typeAliasOrDef(g, type)
//     const config = g.config.importConfig ? `ext.config` : "config"
//     return unindent(`function* ${id}(bytes/*: ArrayBuffer | Uint8Array*/)/*: Generator<${indent(
//         rType
//     )}>*/ {
//         const bc = new bare.ByteCursor(bytes, ${config})
//         while (bc.offset < bc.view.byteLength) {
//             yield ${indent(reader, 2)}(bc)
//         }
//     }`)
// }

// encode

function genEncoder(g: CodeGen, type: BareType, alias = ""): string {
    const config = g.config.importConfig ? `ext.config` : "config"
    return unindent(`${genEncoderHead(g, type, alias)} {
        const bc = new bare.ByteCursor(
            new Uint8Array(${config}.initialBufferLength),
            ${config}
        )
        ${indent(genWriter(g, type), 2)}(bc, x)
        return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
    }`)
}

// function genEncoderInto(g: CodeGen, type: BareType, id = ""): string {
//     const config = g.config.importConfig ? `ext.config` : "config"
//     return unindent(`function ${id}(x/*: ${indent(
//         typeAliasOrDef(g, type)
//     )}*/, into/*: ArrayBuffer | Uint8Array*/)/*: Uint8Array*/ {
//         const newConfig = bare.Config(${config})
//         // Set config to prevent allocation of a new buffer
//         Object.assign(newConfig, { maxBufferLength: into.length })
//         const bc = new bare.ByteCursor(into, newConfig)
//         ${indent(genWriter(g, type), 2)}(bc, x)
//         return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
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

/**
 * @param s identifier
 * @returns valid JS identifier
 */
function jsIdFrom(s: string): string {
    return JS_RESERVED_WORD.indexOf(s) !== -1 ||
        /^(assert|bare|bc|ext|x)$|^read/.test(s)
        ? "_" + s
        : s
}

const JS_RESERVED_WORD: readonly string[] =
    `await break case catch class const continue debugger default delete do else
    enum export extends false finally for function if implements import in
    instance interface of new null package private protected public return super
    switch this throw true try typeof var void while with yield`.split(/\s+/g)
