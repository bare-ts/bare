//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import * as ast from "./bare-ast.js"

export function normalize(schema: ast.Ast): ast.Ast {
    const defs = schema.defs.slice()
    const n: Context = { mutSchema: defs, dedup: new Map(), aliasCount: 0 }
    for (let i = 0; i < defs.length; i++) {
        const type = normalizeSubtypes(n, defs[i].type)
        if (defs[i].type !== type) {
            const { alias, internal, loc } = defs[i]
            defs[i] = { alias, internal, type, loc }
        }
    }
    return defs.length > schema.defs.length
        ? { defs, main: schema.main, loc: schema.loc }
        : schema
}

interface Context {
    readonly mutSchema: ast.AliasedType[]
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
        case "list":
            if (!type.extra?.typedArray) {
                return genAlias(n, type)
            }
            break
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
        alias = `${n.aliasCount++}`
        n.mutSchema.push({ alias, internal: true, type, loc: null })
        n.dedup.set(stringifiedType, alias)
    }
    return { tag: "alias", data: alias, types: null, extra: null, loc: null }
}
