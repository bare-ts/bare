import * as ast from "../ast/bare-ast.js"
import { Config, ConfigError } from "../core/config.js"

export function generate(schema: ast.Ast, config: Config): string {
    const g = Gen(config, ast.symbols(schema)) // may throw
    let body = ""
    for (const aliased of schema.defs) {
        switch (g.config.generator) {
            case "dts":
                if (aliased.exported) {
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
                if (aliased.exported) {
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

interface Gen {
    readonly config: Config
    readonly symbols: ast.SymbolTable
}

function Gen(config: Config, symbols: ast.SymbolTable): Gen {
    for (const alias of config.main) {
        const aliased = symbols.get(alias)
        if (aliased === undefined) {
            throw new ConfigError(`Main codec '${alias}' does not exist.`)
        }
        if (!aliased.exported) {
            throw new ConfigError(`A main codec must be exported.`)
        }
    }
    return { config, symbols }
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
                4
            )
        }
    }
    return `export type ${alias} = ${genType(g, type)}`
}

function typeAliasOrDef(g: Gen, type: ast.Type, alias: string): string {
    const aliased = g.symbols.get(alias)
    return aliased !== undefined && aliased.exported ? alias : genType(g, type)
    // TODO: just genType?
}

function namespaced(g: Gen, alias: string): string {
    return g.symbols.get(alias) !== undefined ? "" : "ext."
}

function genType(g: Gen, type: ast.Type): string {
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
        case "typedarray":
            return genTypedArrayType(g, type)
        case "union":
            return genUnionType(g, type)
        case "void":
            return "undefined"
    }
}

function genAliasType(g: Gen, type: ast.Alias): string {
    const aliased = g.symbols.get(type.props.alias)
    if (aliased !== undefined && !aliased.exported) {
        return genType(g, aliased.type) // inline a non-exported aliased type
    }
    return `${namespaced(g, type.props.alias)}${type.props.alias}`
}

function genArrayType(g: Gen, type: ast.ArrayType): string {
    const valTypedef = genType(g, type.types[0])
    return type.props.mut ? `${valTypedef}[]` : `readonly (${valTypedef})[]`
}

function genEnumType(_g: Gen, type: ast.EnumType): string {
    const { intEnum, vals } = type.props
    return vals.map(({ name, val }) => (intEnum ? `${val}` : name)).join(" | ")
}

function genAliasedEnumType(g: Gen, alias: string, type: ast.EnumType): string {
    let body = ""
    let defaultVal = 0
    let usedName = false
    for (const { name, val } of type.props.vals) {
        if (!type.props.intEnum) {
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

function genOptionalType(g: Gen, type: ast.OptionalType): string {
    const typedef = genType(g, type.types[0])
    const optionalValue = type.props.lax
        ? "undefined | null"
        : type.props.null
        ? "null"
        : "undefined"
    return `${typedef} | ${optionalValue}`
}

function genLiteralType(_g: Gen, type: ast.LiteralType): string {
    return typeof type.props.val === "string"
        ? `"${type.props.val}"`
        : `${type.props.val}`
}

function genMapType(g: Gen, type: ast.MapType): string {
    const genKeyType = genType(g, type.types[0])
    const genValType = genType(g, type.types[1])
    const mapType = type.props.mut ? "Map" : "ReadonlyMap"
    return `${mapType}<${genKeyType}, ${genValType}>`
}

function genSetType(g: Gen, type: ast.SetType): string {
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
    const members = type.props.fields.map(
        ({ mut, name }, i) =>
            `${mut ? "" : "readonly "}${name}: ${genType(g, type.types[i])}`
    )
    return members.join("\n")
}

function genStructTypeClassBody(g: Gen, type: ast.StructType): string {
    const params = type.props.fields
        .map(({ name }, i) => `${jsId(name)}: ${genType(g, type.types[i])},`)
        .join("\n")
    return unindent(
        `${indent(genStructTypeBody(g, type), 2)}
        constructor(
            ${indent(params, 3)}
        )`,
        2
    )
}

function genTypedArrayType(_g: Gen, type: ast.TypedArrayType): string {
    return ast.TYPED_ARRAY_VAL_TYPE_TO_ARRAY[type.props.valType]
}

function genUnionType(g: Gen, type: ast.UnionType): string {
    let result = ""
    for (let i = 0; i < type.types.length; i++) {
        const valType = genType(g, type.types[i])
        result += type.props.flat
            ? `\n| ${valType}`
            : `\n| { readonly tag: ${type.props.tags[i]}; readonly val: ${valType} }`
    }
    return indent(result)
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
    const modifier = aliased.exported ? "export " : ""
    if (aliased.type.tag === "enum" && g.config.generator === "js") {
        return modifier + genAliasedEnumCode(g, aliased.alias, aliased.type)
    }
    if (
        aliased.type.tag === "struct" &&
        aliased.type.props.class &&
        aliased.exported &&
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
                : `${name}: "${name}"`
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
    type: ast.StructType
): string {
    const ts = g.config.generator === "ts"
    const members = ts ? "\n" + genStructTypeBody(g, type) : ""
    const params = type.props.fields
        .map(
            ({ name }, i) =>
                `${jsId(name)}` + (ts ? `: ${genType(g, type.types[i])},` : ",")
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
    const reader = genReader(g, aliased.type, `${aliased.alias}`)
    const statement = reader.startsWith("function")
        ? reader
        : `const read${aliased.alias} = ${reader}`
    return (aliased.exported ? "export " : "") + statement
}

function genReader(g: Gen, type: ast.Type, alias = ""): string {
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
        case "typedarray":
            return genTypedArrayReader(g, type, alias)
        case "union":
            return genUnionReader(g, type, alias)
    }
}

function genArrayReader(g: Gen, type: ast.ArrayType, alias = ""): string {
    const valReader = genReader(g, type.types[0])
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

function genDataReader(g: Gen, type: ast.DataType, alias = ""): string {
    if (type.props.len == null) {
        return `bare.readData`
    }
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        return bare.readFixedData(bc, ${type.props.len})
    }`)
}

function genEnumReader(g: Gen, type: ast.EnumType, alias = ""): string {
    const rType = typeAliasOrDef(g, type, alias)
    const lastTag = type.props.vals[type.props.vals.length - 1].val
    const tagReader = lastTag < 128 ? "bare.readU8" : "bare.readUintSafe"
    const signature = genReaderHead(g, type, alias)
    if (type.props.intEnum && lastTag === type.props.vals.length - 1) {
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
    const intEnum = type.props.intEnum
    for (const { name, val } of type.props.vals) {
        const enumVal =
            alias !== "" ? `${alias}.${name}` : intEnum ? val : `"${name}"`
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

function genLiteralReader(g: Gen, type: ast.LiteralType, alias = ""): string {
    const val = type.props.val
    const rVal = typeof val === "string" ? `"${val}"` : `${val}`
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        return ${rVal}
    }`)
}

function genMapReader(g: Gen, type: ast.MapType, alias = ""): string {
    const [keyType, valType] = type.types
    const kType = genType(g, keyType)
    const vType = genType(g, valType)
    const MapGenerics =
        g.config.generator === "js"
            ? ""
            : `<${indent(kType, 2)}, ${indent(vType, 2)}>`
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        const len = bare.readUintSafe(bc)
        const result = new Map${MapGenerics}()
        for (let i = 0; i < len; i++) {
            const offset = bc.offset
            const key = (${indent(genReader(g, keyType), 2)})(bc)
            if (result.has(key)) {
                bc.offset = offset
                throw new bare.BareError(offset, "duplicated key")
            }
            result.set(key, (${indent(genReader(g, valType), 2)})(bc))
        }
        return result
    }`)
}

function genOptionalReader(g: Gen, type: ast.OptionalType, alias = ""): string {
    const noneVal = type.props.null ? "null" : "undefined"
    return unindent(`${indent(genReaderHead(g, type, alias))} {
        return bare.readBool(bc)
            ? (${indent(genReader(g, type.types[0]), 3)})(bc)
            : ${noneVal}
    }`)
}

function genSetReader(g: Gen, type: ast.SetType, alias = ""): string {
    const valType = type.types[0]
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

function genStructReader(g: Gen, type: ast.StructType, alias = ""): string {
    let fieldInit = ""
    let objBody = ""
    let factoryArgs = ""
    const fields = type.props.fields
    for (let i = 0; i < type.types.length; i++) {
        const fieldReader = genReader(g, type.types[i])
        const name = jsId(fields[i].name)
        fieldInit += `const ${name} = (${fieldReader})(bc)\n`
        factoryArgs += `${name}, `
        if (fields[i].name === name) {
            objBody += `\n${name},`
        } else {
            objBody += `\n${fields[i].name}: ${name},`
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
        g.symbols.get(alias)?.exported
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
    g: Gen,
    type: ast.TypedArrayType,
    id = ""
): string {
    const typeName = capitalize(type.props.valType)
    if (type.props.len == null) {
        return `bare.read${typeName}Array`
    }
    return unindent(`${indent(genReaderHead(g, type, id))} {
        return bare.read${typeName}FixedArray(bc, ${type.props.len})
    }`)
}

function genUnionReader(g: Gen, type: ast.UnionType, alias = ""): string {
    const lastTag = type.props.tags[type.props.tags.length - 1]
    const tagReader = lastTag < 128 ? "bare.readU8" : "bare.readUintSafe"
    const flatten = type.props.flat
    let switchBody = ""
    for (let i = 0; i < type.types.length; i++) {
        const reader = genReader(g, type.types[i])
        if (flatten) {
            switchBody += `
            case ${type.props.tags[i]}:
                return (${reader})(bc)`
        } else {
            switchBody += `
            case ${type.props.tags[i]}: {
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

function genAliasedWriter(g: Gen, aliased: ast.AliasedType): string {
    const writer = genWriter(g, aliased.type, `${aliased.alias}`)
    const statement = writer.startsWith("function")
        ? writer
        : `const write${aliased.alias} = ${writer}`
    return (aliased.exported ? "export " : "") + statement
}

function genWriter(g: Gen, type: ast.Type, alias = ""): string {
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
        case "typedarray":
            return genTypedArrayWriter(g, type, alias)
        case "union":
            return genUnionWriter(g, type, alias)
    }
}

function genArrayWriter(g: Gen, type: ast.ArrayType, alias = ""): string {
    const lenEncoding =
        type.props.len != null
            ? `assert(x.length === ${type.props.len}, "Unmatched length")`
            : `bare.writeUintSafe(bc, x.length)`
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        ${lenEncoding}
        for (let i = 0; i < x.length; i++) {
            (${indent(genWriter(g, type.types[0]), 2)})(bc, x[i])
        }
    }`)
}

function genDataWriter(g: Gen, type: ast.DataType, alias = ""): string {
    if (type.props.len == null) {
        return `bare.writeData`
    }
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        assert(x.byteLength === ${type.props.len})
        bare.writeFixedData(bc, x)
    }`)
}

function genEnumWriter(g: Gen, type: ast.EnumType, alias = ""): string {
    const lastTag = type.props.vals[type.props.vals.length - 1].val
    const tagWriter = lastTag < 128 ? "bare.writeU8" : "bare.writeUintSafe"
    const signature = genWriterHead(g, type, alias)
    if (type.props.intEnum) {
        return unindent(
            `${signature} {
            ${tagWriter}(bc, x)
        }`,
            2
        )
    }
    let switchBody = ""
    const intEnum = type.props.intEnum
    for (const { name, val } of type.props.vals) {
        const enumVal =
            alias !== "" ? `${alias}.${name}` : intEnum ? val : `"${name}"`
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

function genLiteralWriter(g: Gen, type: ast.LiteralType, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        // do nothing
    }`)
}

function genMapWriter(g: Gen, type: ast.MapType, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        bare.writeUintSafe(bc, x.size)
        for(const kv of x) {
            (${indent(genWriter(g, type.types[0]), 2)})(bc, kv[0]);
            (${indent(genWriter(g, type.types[1]), 2)})(bc, kv[1])
        }
    }`)
}

function genOptionalWriter(g: Gen, type: ast.OptionalType, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        bare.writeBool(bc, x != null)
        if (x != null) {
            (${indent(genWriter(g, type.types[0]), 3)})(bc, x)
        }
    }`)
}

function genSetWriter(g: Gen, type: ast.SetType, alias = ""): string {
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        bare.writeUintSafe(bc, x.size)
        for (const v of x) {
            (${indent(genWriter(g, type.types[0]), 2)})(bc, v)
        }
    }`)
}

function genStructWriter(g: Gen, type: ast.StructType, alias = ""): string {
    const fieldEncoding = type.props.fields.map(
        ({ name }, i) => `(${genWriter(g, type.types[i])})(bc, x.${name});`
    )
    return unindent(`${indent(genWriterHead(g, type, alias))} {
        ${indent(fieldEncoding.join("\n"), 2)}
    }`)
}

function genTypedArrayWriter(
    g: Gen,
    type: ast.TypedArrayType,
    id = ""
): string {
    if (type.props.len == null) {
        return `bare.write${capitalize(type.props.valType)}Array`
    }
    return unindent(`${indent(genWriterHead(g, type, id))} {
        assert(x.length === ${type.props.len})
        return bare.write${capitalize(type.props.valType)}FixedArray(bc, x)
    }`)
}

function genUnionWriter(g: Gen, type: ast.UnionType, alias = ""): string {
    const xType = typeAliasOrDef(g, type, alias)
    const lastTag = type.props.tags[type.props.tags.length - 1]
    const tagWriter = lastTag < 128 ? "bare.writeU8" : "bare.writeUintSafe"
    const tagExp = type.props.flat ? `ext.tag${xType}(x)` : "x.tag"
    const valExp = type.props.flat
        ? g.config.generator === "ts"
            ? "x as any"
            : "x"
        : "x.val"
    let switchBody = ""
    for (let i = 0; i < type.types.length; i++) {
        switchBody += `
        case ${type.props.tags[i]}:
            (${genWriter(g, type.types[i])})(bc, ${valExp})
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

/**
 * @param s identifier
 * @returns valid JS identifier
 */
function jsId(s: string): string {
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