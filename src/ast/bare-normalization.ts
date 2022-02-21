import * as ast from "./bare-ast.js"

export function normalize(schema: ast.Ast): ast.Ast {
    const defs = schema.defs.slice()
    const n: Context = { mutSchema: defs, dedup: new Map(), aliasCount: 0 }
    for (let i = 0; i < defs.length; i++) {
        const type = normalizeSubtypes(n, defs[i].type)
        if (defs[i].type !== type) {
            const { alias, exported, loc } = defs[i]
            defs[i] = { alias, exported, type, loc }
        }
    }
    return defs.length > schema.defs.length ? { defs, loc: schema.loc } : schema
}

interface Context {
    readonly mutSchema: ast.AliasedType[]
    readonly dedup: Map<unknown, string>
    aliasCount: number
}

function normalizeSubtypes(n: Context, type: ast.Type): ast.Type {
    if (type.types != null && type.types.length > 0) {
        const types = type.types.map((t) => maybeAlias(n, t))
        if (type.types.some((t, i) => t !== types[i])) {
            const { tag, props, loc } = type
            // we don't use spread operator to preserve the object's shape
            // Indeed: shapeOf({ x, y }) != shapeOf({ ...{ x, y } })
            return { tag, props, types, loc } as ast.Type
        }
    }
    return type
}

function maybeAlias(n: Context, type: ast.Type): ast.Type {
    switch (type.tag) {
        case "array":
        case "enum":
        case "literal":
        case "map":
        case "optional":
        case "set":
        case "struct":
        case "union":
            return genAlias(n, type)
        case "data":
        case "typedarray":
            if (type.props.len != null) {
                return genAlias(n, type)
            }
            return type
    }
    return type
}

function genAlias(n: Context, type: ast.Type): ast.Alias {
    // NOTE: this dirty check is ok because we initialize
    // every object in the same way (properties are in the same order)
    const stringifiedType = JSON.stringify(ast.withoutLoc(type))
    let alias = n.dedup.get(stringifiedType)
    if (alias == null) {
        alias = `${n.aliasCount++}`
        n.mutSchema.push({ alias, exported: false, type, loc: null })
        n.dedup.set(stringifiedType, alias)
    }
    return { tag: "alias", props: { alias }, types: null, loc: null }
}
