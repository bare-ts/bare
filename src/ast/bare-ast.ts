export type BareAst = readonly AliasedBareType[]

export interface AliasedBareType {
    readonly alias: string
    readonly exported: boolean
    readonly type: BareType
}

export type BareType =
    | BareAlias // Named user type
    | BareArray // []type, [n]type
    | BareData // data, data<length>
    | BareEnum
    | BareLiteral // map[type]type
    | BareMap // map[type]type
    | BareOptional // optional<type>
    | BarePropertyLessType
    | BareSet // []type
    | BareStruct // { fields... }
    | BareTypedArray
    | BareUnion // (type | ...)

export interface BareAlias {
    readonly tag: "alias"
    readonly props: {
        readonly alias: string
    }
}

export interface BareArray {
    readonly tag: "array"
    readonly props: {
        readonly len: number | null
        readonly mutable: boolean
        readonly valType: BareType
    }
}

export interface BareData {
    readonly tag: "data"
    readonly props: {
        readonly len: number | null
    }
}

export interface BareEnum {
    readonly tag: "enum"
    readonly props: {
        readonly useName: boolean
        readonly vals: readonly EnumVal[]
    }
}

export interface BareLiteral {
    readonly tag: "literal"
    readonly props: {
        readonly val: string | number
    }
}

export interface BareMap {
    readonly tag: "map"
    readonly props: {
        readonly keyType: BareType
        readonly mutable: boolean
        readonly valType: BareType
    }
}

export interface BareOptional {
    readonly tag: "optional"
    readonly props: {
        readonly permissive: boolean
        readonly null: boolean
        readonly type: BareType
    }
}

export interface BarePropertyLessType {
    readonly tag: PropertyLessTypeTag
    readonly props: {}
}

export interface BareSet {
    readonly tag: "set"
    readonly props: {
        readonly mutable: boolean
        readonly valType: BareType
    }
}

export interface BareStruct {
    readonly tag: "struct"
    readonly props: {
        readonly class: boolean
        readonly fields: readonly StructField[]
    }
}

export interface BareTypedArray {
    readonly tag: "typedArray"
    readonly props: {
        readonly len: number | null
        readonly valTypeName: TypedArrayValType
    }
}

export interface BareUnion {
    readonly tag: "union"
    readonly props: {
        readonly flat: boolean
        readonly units: readonly UnionUnit[]
    }
}

export const PROPERTY_LESS_TAG = [
    "bool",
    "f32",
    "f64",
    "i8",
    "i16",
    "i32",
    "i64Safe",
    "i64",
    "int",
    "intSafe",
    "string",
    "u8",
    "u16",
    "u32",
    "u64",
    "u64Safe",
    "uint",
    "uintSafe",
    "void",
] as const

export type PropertyLessTypeTag = typeof PROPERTY_LESS_TAG[number]

export function isPropertylessTag(tag: string): tag is PropertyLessTypeTag {
    return PROPERTY_LESS_TAG.indexOf(tag as PropertyLessTypeTag) !== -1
}

export interface EnumVal {
    readonly name: string
    readonly val: /* non-zero safe-u64 */ number
}

export interface StructField {
    readonly mutable: boolean
    readonly name: string
    readonly type: BareType
}

export const TYPED_ARRAY_VAL_TYPE = [
    "i8",
    "i16",
    "i32",
    "i64",
    "u8",
    "u8Clamped",
    "u16",
    "u32",
    "u64",
] as const

export type TypedArrayValType = typeof TYPED_ARRAY_VAL_TYPE[number]

export function isTypedArrayValType(name: string): name is TypedArrayValType {
    return TYPED_ARRAY_VAL_TYPE.indexOf(name as TypedArrayValType) !== -1
}

export interface UnionUnit {
    readonly tagVal: /* non-zero safe-u64 */ number
    readonly type: BareType
}

export function aliasToAliased(ast: BareAst): Map<string, AliasedBareType> {
    const result = new Map<string, AliasedBareType>()
    for (const aliased of ast) {
        result.set(aliased.alias, aliased)
    }
    return result
}

export function typeToAliased(ast: BareAst): Map<BareType, AliasedBareType> {
    const result = new Map<BareType, AliasedBareType>()
    for (const aliased of ast) {
        result.set(aliased.type, aliased)
    }
    return result
}
