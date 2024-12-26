//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import type { Config } from "../core/config.ts"
import * as ast from "./bare-ast.ts"

export function configure(schema: ast.Ast, config: Config): ast.Ast {
    const c: Configurator = {
        config,
        aliasesInFlatUnion: new Set(),
        symbols: ast.symbols(schema),
    }
    const defs: ast.AliasedType[] = []
    for (let def of schema.defs) {
        const type = configureType(c, def.type, true)
        if (def.type !== type) {
            const { alias, internal, comment, offset } = def
            def = { alias, internal, type, comment, offset }
        }
        defs.push(def)
    }
    for (let i = 0; i < defs.length; i++) {
        let type = defs[i].type
        if (
            c.aliasesInFlatUnion.has(defs[i].alias) &&
            type.tag === "struct" &&
            !type.extra?.class
        ) {
            const { alias, internal, comment, offset } = defs[i]
            type = embeddedTag(type, defs[i].alias)
            defs[i] = { alias, internal, comment, type, offset }
        }
    }
    if (schema.defs.some((def, i) => def !== defs[i])) {
        return { defs, filename: schema.filename, offset: schema.offset }
    }
    return schema
}

type Configurator = {
    readonly config: Config
    readonly aliasesInFlatUnion: Set<string>
    readonly symbols: ast.SymbolTable
}

function configureType(
    c: Configurator,
    type: ast.Type,
    isAliased = false,
): ast.Type {
    const config = c.config
    let { data, extra } = type
    let types = type.types != null ? configureTypes(c, type.types) : type.types
    if (extra == null) {
        const { useMutable: mut, useUndefined } = config
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
                if (useUndefined) {
                    const literal: ast.Literal = useUndefined
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
                if (
                    config.usePrimitiveFlatUnion &&
                    types != null &&
                    types.every(ast.isBaseOrVoidType) &&
                    ast.haveDistinctTypeof(type.types)
                ) {
                    extra = { flat: true }
                } else if (
                    config.useStructFlatUnion &&
                    types != null &&
                    types.every(
                        (t) => t.tag === "alias" || t.tag === "struct",
                    ) &&
                    types
                        .map((t) =>
                            t.tag === "alias"
                                ? (c.symbols.get(t.data)?.type ?? t)
                                : t,
                        )
                        .every(
                            (t) =>
                                t.tag === "struct" &&
                                t.data.every((f) => f.name !== "tag"),
                        )
                ) {
                    extra = { flat: true }
                    const newTypes: ast.Type[] = []
                    for (let i = 0; i < types.length; i++) {
                        let subtype = types[i]
                        if (subtype.tag === "alias") {
                            c.aliasesInFlatUnion.add(subtype.data)
                        } else if (subtype.tag === "struct") {
                            subtype = embeddedTag(subtype, type.data[i].val)
                        }
                        newTypes.push(subtype)
                    }
                    types = newTypes.every(
                        (t, i) => types != null && t === types[i],
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
        return {
            tag: type.tag,
            data,
            types,
            extra,
            offset: type.offset,
        } as ast.Type
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
    if (field.extra == null && mut) {
        const { name, val, comment, offset } = field
        return { name, val, extra: { mut }, comment, offset }
    }
    return field
}

function embeddedTag(
    type: ast.StructType,
    val: string | number,
): ast.StructType {
    const { extra, offset } = type
    const data = type.data.slice()
    data.splice(0, 0, {
        name: "tag",
        val: null,
        comment: "",
        extra: { mut: false },
        offset,
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
        offset,
    })
    return { tag: "struct", data, types, extra, offset }
}
