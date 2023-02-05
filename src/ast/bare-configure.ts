//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import type { Config } from "../core/config.js"
import * as ast from "./bare-ast.js"

export function configure(schema: ast.Ast, config: Config): ast.Ast {
    const c: Configurator = { config, aliasesInFlatUnion: new Set() }
    const defs = schema.defs.slice()
    for (let i = 0; i < defs.length; i++) {
        const type = configureType(c, defs[i].type, true)
        if (defs[i].type !== type) {
            const { alias, internal, comment, loc } = defs[i]
            defs[i] = { alias, internal, type, comment, loc }
        }
    }
    for (let i = 0; i < defs.length; i++) {
        let type = defs[i].type
        if (
            c.aliasesInFlatUnion.has(defs[i].alias) &&
            type.tag === "struct" &&
            !type.extra?.class
        ) {
            const { alias, internal, comment, loc } = defs[i]
            type = embeddedTag(c, type, defs[i].alias)
            defs[i] = { alias, internal, comment, type, loc }
        }
    }
    if (schema.defs.some((def, i) => def !== defs[i])) {
        return { defs, loc: schema.loc }
    }
    return schema
}

type Configurator = {
    readonly config: Config
    readonly aliasesInFlatUnion: Set<string>
}

function configureType(
    c: Configurator,
    type: ast.Type,
    isAliased = false,
): ast.Type {
    const config = c.config
    let { data, extra } = type
    let types = type.types !== null ? configureTypes(c, type.types) : type.types
    if (extra === null) {
        const mut = config.useMutable
        const undef = config.useUndefined
        switch (type.tag) {
            case "enum": {
                if (config.useIntEnum) {
                    extra = { intEnum: true }
                }
                break
            }
            case "list": {
                const typedArray =
                    !config.useGenericArray &&
                    ast.isFixedNumericTag(type.types[0].tag)
                if (mut || typedArray) {
                    extra = { mut, typedArray, unique: false }
                }
                break
            }
            case "map": {
                if (mut) {
                    extra = { mut }
                }
                break
            }
            case "optional":
            case "void": {
                if (undef) {
                    const literal: ast.Literal = undef
                        ? ast.UNDEFINED_LITERAL_VAL
                        : ast.NULL_LITERAL_VAL
                    extra = { literal }
                }
                break
            }
            case "struct": {
                data = configureFields(type.data, config)
                if (isAliased && config.useClass) {
                    extra = { class: true }
                }
                break
            }
            case "union": {
                if (config.useFlatUnion && types !== null) {
                    extra = { flat: true }
                    const newTypes: ast.Type[] = []
                    for (let i = 0; i < types.length; i++) {
                        let subtype = types[i]
                        if (subtype.tag === "alias") {
                            c.aliasesInFlatUnion.add(subtype.data)
                        } else if (subtype.tag === "struct") {
                            subtype = embeddedTag(c, subtype, type.data[i].val)
                        }
                        newTypes.push(subtype)
                    }
                    types = newTypes.every(
                        (t, i) => types !== null && t === types[i],
                    )
                        ? types
                        : newTypes
                }
                break
            }
            case "i64":
            case "int":
            case "u64":
            case "uint": {
                if (config.useSafeInt) {
                    extra = { safe: true }
                }
                break
            }
        }
    }
    if (type.data !== data || type.types !== types || type.extra !== extra) {
        return { tag: type.tag, data, types, extra, loc: type.loc } as ast.Type
    }
    return type
}

function configureTypes(
    c: Configurator,
    types: readonly ast.Type[],
): readonly ast.Type[] {
    const configuredTypes = types.map((t) => configureType(c, t))
    if (configuredTypes.some((t, i) => t !== types[i])) {
        return configuredTypes
    }
    return types
}

function configureFields(
    fields: readonly ast.StructField[],
    config: Config,
): readonly ast.StructField[] {
    const configuredFields = fields.map((f) => configureField(f, config))
    if (configuredFields.some((f, i) => f !== fields[i])) {
        return configuredFields
    }
    return fields
}

function configureField(
    field: ast.StructField,
    config: Config,
): ast.StructField {
    const mut = config.useMutable
    const quoted = config.useQuotedProperty
    if (field.extra === null && (mut || quoted)) {
        const { name, val, comment, loc } = field
        return { name, val, extra: { mut, quoted }, comment, loc }
    }
    return field
}

function embeddedTag(
    n: Configurator,
    type: ast.StructType,
    val: string | number,
): ast.StructType {
    const { extra, loc } = type
    const data = type.data.slice()
    data.splice(0, 0, {
        name: "tag",
        val: null,
        comment: null,
        extra: { mut: false, quoted: n.config.useQuotedProperty },
        loc,
    })
    const literal: ast.Literal =
        typeof val === "string"
            ? { type: "string", val }
            : { type: "number", val }
    const types = type.types.slice()
    types.splice(0, 0, {
        tag: "void",
        data: null,
        types: null,
        extra: { literal },
        loc,
    })
    return { tag: "struct", data, types, extra, loc }
}
