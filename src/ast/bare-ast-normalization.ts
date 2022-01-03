import type {
    AliasedBareType,
    BareAst,
    BareAlias,
    BareType,
} from "./bare-ast.js"

export function normalize(ast: BareAst): BareAst {
    const mutAst = ast.slice()
    const an = { mutAst, aliasCount: 0 }
    for (let i = 0; i < mutAst.length; i++) {
        const aliased = mutAst[i]
        const type = normalizeType(an, aliased.type)
        if (aliased.type !== type) {
            const { alias, exported } = aliased
            mutAst[i] = { alias, exported, type }
        }
    }
    return mutAst.length !== ast.length ? mutAst : ast
}

interface BareAstNormalizer {
    readonly mutAst: AliasedBareType[]
    aliasCount: number
}

function normalizeType(an: BareAstNormalizer, type: BareType): BareType {
    switch (type.tag) {
        case "alias":
        case "bool":
        case "data":
        case "enum":
        case "f32":
        case "f64":
        case "i8":
        case "i16":
        case "i32":
        case "i64":
        case "i64Safe":
        case "int":
        case "intSafe":
        case "literal":
        case "string":
        case "typedArray":
        case "u8":
        case "u16":
        case "u32":
        case "u64":
        case "u64Safe":
        case "uint":
        case "uintSafe":
        case "void":
            return type
        case "array": {
            const { len, mutable } = type.props
            const valType = maybeAlias(an, type.props.valType)
            return type.props.valType !== valType
                ? { tag: "array", props: { len, mutable, valType } }
                : type
        }
        case "map": {
            const { mutable } = type.props
            const keyType = maybeAlias(an, type.props.keyType)
            const valType = maybeAlias(an, type.props.valType)
            return type.props.keyType !== keyType ||
                type.props.valType !== valType
                ? { tag: "map", props: { mutable, keyType, valType } }
                : type
        }
        case "optional": {
            const { permissive, null: noneVal } = type.props
            const subtype = maybeAlias(an, type.props.type)
            return type.props.type !== subtype
                ? {
                      tag: "optional",
                      props: { permissive, null: noneVal, type: subtype },
                  }
                : type
        }
        case "set": {
            const { mutable } = type.props
            const valType = maybeAlias(an, type.props.valType)
            return type.props.valType !== valType
                ? { tag: "set", props: { mutable, valType } }
                : type
        }
        case "struct": {
            let atLeastOneAliased = false
            const fields = []
            for (let field of type.props.fields) {
                const fieldType = maybeAlias(an, field.type)
                if (field.type !== fieldType) {
                    atLeastOneAliased = true
                    field = {
                        mutable: field.mutable,
                        name: field.name,
                        type: fieldType,
                    }
                }
                fields.push(field)
            }
            return atLeastOneAliased
                ? { tag: "struct", props: { fields } }
                : type
        }
        case "union": {
            let atLeastOneAliased = false
            const units = []
            for (let unit of type.props.units) {
                const unitType = maybeAlias(an, unit.type)
                if (unit.type !== unitType) {
                    atLeastOneAliased = true
                    unit = { tagVal: unit.tagVal, type: unitType }
                }
                units.push(unit)
            }
            return atLeastOneAliased
                ? {
                      tag: "union",
                      props: { flat: type.props.flat, units },
                  }
                : type
        }
    }
}

function maybeAlias(an: BareAstNormalizer, type: BareType): BareType {
    switch (type.tag) {
        case "alias":
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
            return type
        case "array":
        case "enum":
        case "literal":
        case "map":
        case "optional":
        case "set":
        case "struct":
        case "union":
            return genAlias(an, type)
        case "data":
        case "typedArray":
            if (type.props.len != null) {
                return genAlias(an, type)
            }
            return type
    }
}

function genAlias(an: BareAstNormalizer, type: BareType): BareAlias {
    const alias = `${an.aliasCount++}`
    an.mutAst.push({ alias, exported: false, type })
    return { tag: "alias", props: { alias } }
}
