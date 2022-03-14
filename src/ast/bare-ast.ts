import type { Location } from "../core/compiler-error.js"

export interface Ast {
    readonly defs: readonly AliasedType[]
    readonly loc: Location | null
}

export interface AliasedType {
    readonly alias: string
    readonly exported: boolean
    readonly type: Type
    readonly loc: Location | null
}

export type Type =
    | Alias // Named user type
    | ArrayType // []type, [n]type
    | DataType // data, data<length>
    | EnumType
    | LiteralType // map[type]type
    | MapType // map[type]type
    | OptionalType // optional<type>
    | BaseType
    | SetType // []type
    | StructType // { fields... }
    | TypedArrayType
    | UnionType // (type | ...)
    | VoidType // void

export interface Alias {
    readonly tag: "alias"
    readonly props: {
        readonly alias: string
    }
    readonly types: null
    readonly loc: Location | null
}

export interface ArrayType {
    readonly tag: "array"
    readonly props: {
        readonly len: number | null
        readonly mut: boolean
    }
    readonly types: readonly [valType: Type]
    readonly loc: Location | null
}

export interface DataType {
    readonly tag: "data"
    readonly props: {
        readonly len: number | null
        readonly mut: boolean
    }
    readonly types: null
    readonly loc: Location | null
}

export interface EnumType {
    readonly tag: "enum"
    readonly props: {
        readonly intEnum: boolean
        readonly vals: readonly EnumVal[]
    }
    readonly types: null
    readonly loc: Location | null
}

export interface EnumVal {
    readonly name: string
    readonly val: number
    readonly loc: Location | null
}

export interface LiteralType {
    readonly tag: "literal"
    readonly props: {
        readonly val?: Literal
    }
    readonly types: null
    readonly loc: Location | null
}

export type Literal = bigint | boolean | number | null | string | undefined

export interface MapType {
    readonly tag: "map"
    readonly props: {
        readonly mut: boolean
    }
    readonly types: readonly [keyType: Type, valType: Type]
    readonly loc: Location | null
}

export interface OptionalType {
    readonly tag: "optional"
    readonly props: {
        readonly lax: boolean
        readonly undef: boolean
    }
    readonly types: readonly [type: Type]
    readonly loc: Location | null
}

export interface FixedNumberType {
    readonly tag: FixedNumberTag
    readonly props: null
    readonly types: null
    readonly loc: Location | null
}

export interface BaseType {
    readonly tag: BaseTag
    readonly props: null
    readonly types: null
    readonly loc: Location | null
}

export interface SetType {
    readonly tag: "set"
    readonly props: {
        readonly len: null
        readonly mut: boolean
    }
    readonly types: readonly [valType: Type]
    readonly loc: Location | null
}

export interface StructType {
    readonly tag: "struct"
    readonly props: {
        readonly class: boolean
        readonly fields: StructField[]
    }
    readonly types: readonly Type[]
    readonly loc: Location | null
}

export interface StructField {
    readonly mut: boolean
    readonly name: string
    readonly quoted: boolean
    readonly loc: Location | null
}

export interface TypedArrayType {
    readonly tag: "typedarray"
    readonly props: {
        readonly len: number | null
    }
    readonly types: readonly [FixedNumberType]
    readonly loc: Location | null
}

export interface UnionType<T = Type> {
    readonly tag: "union"
    readonly props: {
        readonly flat: boolean
        readonly tags: readonly number[]
    }
    readonly types: readonly T[]
    readonly loc: Location | null
}

export interface VoidType {
    readonly tag: "void"
    readonly props: {
        readonly lax: boolean
        readonly undef: boolean
    }
    readonly types: null
    readonly loc: Location | null
}

export type BaseTag = typeof BASE_TAG[number]

export function isBaseTag(tag: string): tag is BaseTag {
    return BASE_TAG_SET.has(tag)
}

export function isBaseType(type: Type): type is BaseType {
    return isBaseTag(type.tag)
}

export function isBaseOrVoidType(type: Type): type is BaseType | VoidType {
    return isBaseTag(type.tag) || type.tag === "void"
}

export type FixedNumberTag = typeof FIXED_NUMBER_TAG[number]

export function isFixedNumberType(type: Type): type is FixedNumberType {
    return FIXED_NUMBER_TAG_SET.has(type.tag)
}

export const FIXED_NUMBER_TAG = [
    "f32",
    "f64",
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

const FIXED_NUMBER_TAG_SET: ReadonlySet<string> = new Set(FIXED_NUMBER_TAG)

export const BASE_TAG = [
    ...FIXED_NUMBER_TAG,
    "bool",
    "i64Safe",
    "int",
    "intSafe",
    "string",
    "u64Safe",
    "uint",
    "uintSafe",
] as const

const BASE_TAG_SET: ReadonlySet<string> = new Set(BASE_TAG)

export const FIXED_NUMBER_TYPE_TO_TYPED_ARRAY = {
    "f32": "Float32Array",
    "f64": "Float64Array",
    "i8": "Int8Array",
    "i16": "Int16Array",
    "i32": "Int32Array",
    "i64": "BigInt64Array",
    "u8": "Uint8Array",
    "u8Clamped": "Uint8ClampedArray",
    "u16": "Uint16Array",
    "u32": "Uint32Array",
    "u64": "BigUint64Array",
} as const

export type SymbolTable = ReadonlyMap<string, AliasedType>

export function symbols(schema: Ast): SymbolTable {
    const result = new Map<string, AliasedType>()
    for (const aliased of schema.defs) {
        result.set(aliased.alias, aliased)
    }
    return result
}

export function resolveAlias(type: Type, symbols: SymbolTable): Type {
    if (type.tag === "alias") {
        const aliasedType = symbols.get(type.props.alias)
        if (aliasedType !== undefined) {
            return resolveAlias(aliasedType.type, symbols)
        }
    }
    return type
}

export const BASE_TAG_TO_TYPEOF = {
    "bool": "boolean",
    "f32": "number",
    "f64": "number",
    "i8": "number",
    "i16": "number",
    "i32": "number",
    "i64": "bigint",
    "i64Safe": "number",
    "int": "bigint",
    "intSafe": "number",
    "string": "string",
    "u8": "number",
    "u8Clamped": "number",
    "u16": "number",
    "u32": "number",
    "u64": "bigint",
    "u64Safe": "number",
    "uint": "bigint",
    "uintSafe": "number",
} as const

/**
 * @param structs
 * @return if the first field of every struct discriminates these structs in
 *  a union, then the returned value is their discriminators. Otherwise the
 *  result is null.
 */
export function leadingDiscriminators(
    structs: readonly StructType[]
): Literal[] | null {
    if (structs.length > 0) {
        const literals: Set<Literal> = new Set()
        const type0LeadingField = structs[0].props.fields[0]
        for (const struct of structs) {
            const fields = struct.props.fields
            if (
                fields.length === 0 ||
                fields[0].name !== type0LeadingField.name ||
                struct.types[0].tag !== "literal" ||
                literals.has(struct.types[0].props.val)
            ) {
                return null
            }
            literals.add(struct.types[0].props.val)
        }
        return Array.from(literals.values()) // literals in insertion order
    }
    return null
}

/**
 * @param types
 * @returns have `types` distinct typeof values?
 */
export function haveDistinctTypeof(
    types: readonly (BaseType | VoidType)[]
): boolean {
    const typeofValues = types.map((t) =>
        isBaseType(t) ? BASE_TAG_TO_TYPEOF[t.tag] : null
    ) // null for 'object' or 'undefined'
    return types.length === new Set(typeofValues).size
}

/**
 * Recursively traverse the ast and set loc to null
 * @param type
 * @returns type with loc set to null
 */
export function withoutLoc(type: Type): Type {
    return JSON.parse(
        JSON.stringify(type, (name, val) => (name === "loc" ? null : val))
    )
}
