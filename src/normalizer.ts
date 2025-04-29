//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import type * as ast from "./ast.ts"

/**
 * Normalize `schema`.
 * This function should be called before code generation.
 */
export function normalize(schema: ast.Ast): ast.Ast {
    const n: Context = { defs: [], dedup: new Map(), aliasCount: 0 }
    const defs = n.defs
    for (const def of schema.defs) {
        const type = normalizeSubtypes(n, def.type)
        if (def.type !== type) {
            const { alias, internal, comment, offset } = def
            defs.push({ alias, internal, type, comment, offset })
        } else {
            defs.push(def)
        }
    }
    return defs.length > schema.defs.length
        ? { defs, filename: schema.filename, offset: schema.offset }
        : schema
}

type Context = {
    readonly defs: ast.AliasedType[]
    readonly dedup: Map<unknown, string>
    aliasCount: number
}

function normalizeSubtypes(n: Context, type: ast.Type): ast.Type {
    if (type.types != null && type.types.length > 0) {
        const types = type.types.map((t) => maybeAlias(n, t))
        if (type.types.some((t, i) => t !== types[i])) {
            const { tag, data, extra, offset } = type
            // we don't use spread operator to preserve the object's shape
            // Indeed: shapeOf({ x, y }) != shapeOf({ ...{ x, y } })
            return { tag, data, types, extra, offset } as ast.Type
        }
    }
    return type
}

function maybeAlias(n: Context, type: ast.Type): ast.Type {
    switch (type.tag) {
        case "list": {
            if (!type.extra?.typedArray) {
                return genAlias(n, type)
            }
            break
        }
        case "map":
        case "optional":
        case "union":
            return genAlias(n, type)
    }
    return normalizeSubtypes(n, type)
}

function genAlias(n: Context, type: ast.Type): ast.Alias {
    // NOTE: this dirty check is ok because we initialize
    // every object in the same way (properties are in the same order)
    // Comparing types between them regardless their `offset`.
    const stringifiedType = JSON.stringify(type, (name, val) =>
        name === "offset" ? 0 : val,
    )
    let alias = n.dedup.get(stringifiedType)
    if (alias == null) {
        const normalized = normalizeSubtypes(n, type)
        // We use an integer as internal alias.
        // This avoids conflicts with user aliases.
        alias = `${n.aliasCount++}`
        n.defs.push({
            alias,
            internal: true,
            type: normalized,
            comment: "",
            offset: normalized.offset,
        })
        n.dedup.set(stringifiedType, alias)
    }
    const offset = type.offset
    return { tag: "alias", data: alias, types: null, extra: null, offset }
}
