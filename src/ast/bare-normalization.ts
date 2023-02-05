//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import * as ast from "./bare-ast.js"

export function normalize(schema: ast.Ast): ast.Ast {
    const n: Context = { defs: [], dedup: new Map(), aliasCount: 0 }
    const defs = n.defs
    for (const def of schema.defs) {
        const type = normalizeSubtypes(n, def.type)
        if (def.type !== type) {
            const { alias, internal, comment, loc } = def
            defs.push({ alias, internal, type, comment, loc })
        } else {
            defs.push(def)
        }
    }
    return defs.length > schema.defs.length ? { defs, loc: schema.loc } : schema
}

type Context = {
    readonly defs: ast.AliasedType[]
    readonly dedup: Map<unknown, string>
    aliasCount: number
}

function normalizeSubtypes(n: Context, type: ast.Type): ast.Type {
    if (type.types !== null && type.types.length > 0) {
        const types = type.types.map((t) => maybeAlias(n, t))
        if (type.types.some((t, i) => t !== types[i])) {
            const { tag, data, extra, loc } = type
            // we don't use spread operator to preserve the object's shape
            // Indeed: shapeOf({ x, y }) != shapeOf({ ...{ x, y } })
            return { tag, data, types, extra, loc } as ast.Type
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
    const stringifiedType = JSON.stringify(ast.withoutLoc(type))
    let alias = n.dedup.get(stringifiedType)
    if (alias === undefined) {
        const normalized = normalizeSubtypes(n, type)
        // We use an integer as internal alias.
        // This avoids conflicts with user aliases.
        alias = `${n.aliasCount++}`
        n.defs.push({
            alias,
            internal: true,
            type: normalized,
            comment: null,
            loc: normalized.loc,
        })
        n.dedup.set(stringifiedType, alias)
    }
    const loc = type.loc
    return { tag: "alias", data: alias, types: null, extra: null, loc }
}
