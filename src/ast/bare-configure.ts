//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import type { Config } from "../core/config.js"
import * as ast from "./bare-ast.js"

export function configure(schema: ast.Ast, config: Config): ast.Ast {
    const defs = schema.defs.slice()
    for (let i = 0; i < defs.length; i++) {
        const type = configureType(defs[i].type, config)
        if (defs[i].type !== type) {
            const { alias, internal, comment, loc } = defs[i]
            defs[i] = { alias, internal, type, comment, loc }
        }
    }
    if (schema.defs.some((def, i) => def !== defs[i])) {
        return { defs, loc: schema.loc }
    }
    return schema
}

function configureType(type: ast.Type, config: Config): ast.Type {
    let { data, extra } = type
    const types =
        type.types !== null ? configureTypes(type.types, config) : type.types
    if (extra === null) {
        const mut = config.useMutable
        const lax = config.useLaxOptional
        const undef = config.useUndefined
        switch (type.tag) {
            case "enum":
                if (config.useIntEnum) {
                    extra = { intEnum: true }
                }
                break
            case "list": {
                const typedArray =
                    !config.useGenericArray &&
                    ast.isFixedNumericTag(type.types[0].tag)
                if (mut || typedArray) {
                    extra = { mut, typedArray, unique: false }
                }
                break
            }
            case "map":
                if (mut) {
                    extra = { mut }
                }
                break
            case "optional":
            case "void": {
                if (lax || undef) {
                    const literal: ast.Literal = undef
                        ? ast.UNDEFINED_LITERAL_VAL
                        : ast.NULL_LITERAL_VAL
                    extra = { lax, literal }
                }
                break
            }
            case "struct":
                data = configureFields(type.data, config)
                if (config.useClass) {
                    extra = { class: true }
                }
                break
            case "union":
                if (config.useFlatUnion) {
                    extra = { flat: true }
                }
                break
            case "i64":
            case "int":
            case "u64":
            case "uint":
                if (config.useSafeInt) {
                    extra = { safe: true }
                }
                break
        }
    }
    if (type.data !== data || type.types !== types || type.extra !== extra) {
        return { tag: type.tag, data, types, extra, loc: type.loc } as ast.Type
    }
    return type
}

function configureTypes(
    types: readonly ast.Type[],
    config: Config,
): readonly ast.Type[] {
    const configuredTypes = types.map((t) => configureType(t, config))
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
