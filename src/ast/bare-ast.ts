//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import type { Location } from "../core/compiler-error.js"

// The AST must be serializable in JSON.
//
// The serialization of an AST should preserve the structure and data types.
// For instance, if X is an AST, then it verifies the following predicate:
//     deepEqual(X, JSON.parse(JSON.stringify(X)))
//
// To ensure this:
// - do not use undefined. Use null instead.
// - do not use bigint.

export interface Ast {
    readonly defs: readonly AliasedType[]
    readonly loc: Location | null
}

export interface AliasedType {
    readonly alias: string
    // The normalization phase uses this to create internal-only aliases.
    readonly internal: boolean
    readonly comment: string | null
    readonly type: Type
    readonly loc: Location | null
}

/**
 * All types have the same object's shape: { tag, data, types, extra, loc }
 * - `tag` enables to discriminate types
 * - `data` contains type-specific info
 * - `types` contains nested types
 * - `extra` contains information that are not part of BARE specification
 * - `loc` is the location of the AST node in the source
 */
export type Type =
    | Alias // Named user type
    | BaseType // Named user type
    | DataType // data, data<length>
    | EnumType
    | ListType // []type, [n]type
    | MapType // map[type]type
    | OptionalType // optional<type>
    | StructType // { fields... }
    | UnionType // (type | ...)
    | VoidType // void

export interface Alias {
    readonly tag: "alias"
    readonly data: string
    readonly types: null
    readonly extra: null
    readonly loc: Location | null
}

export interface BaseType {
    readonly tag: BaseTag
    readonly data: null
    readonly types: null
    readonly extra: { readonly safe: boolean } | null
    readonly loc: Location | null
}

export interface DataType {
    readonly tag: "data"
    readonly data: Length | null
    readonly types: null
    readonly extra: { readonly mut: boolean } | null
    readonly loc: Location | null
}

export interface EnumType {
    readonly tag: "enum"
    readonly data: readonly EnumVal[]
    readonly types: null
    readonly extra: { readonly intEnum: boolean } | null
    readonly loc: Location | null
}

export interface ListType {
    readonly tag: "list"
    readonly data: Length | null
    readonly types: readonly [valType: Type]
    readonly extra: {
        readonly mut: boolean
        readonly typedArray: boolean
        readonly unique: boolean
    } | null
    readonly loc: Location | null
}

export interface MapType {
    readonly tag: "map"
    readonly data: null
    readonly types: readonly [keyType: Type, valType: Type]
    readonly extra: { readonly mut: boolean } | null
    readonly loc: Location | null
}

export interface OptionalType {
    readonly tag: "optional"
    readonly data: null
    readonly types: readonly [type: Type]
    readonly extra: { readonly lax: boolean; readonly literal: Literal } | null
    readonly loc: Location | null
}

export interface StructType {
    readonly tag: "struct"
    readonly data: readonly StructField[]
    readonly types: readonly Type[]
    readonly extra: { readonly class: boolean } | null
    readonly loc: Location | null
}

export interface UnionType<T = Type> {
    readonly tag: "union"
    readonly data: readonly UnionTag[]
    readonly types: readonly T[]
    readonly extra: { readonly flat: boolean } | null
    readonly loc: Location | null
}

export interface VoidType {
    readonly tag: "void"
    readonly data: null
    readonly types: null
    readonly extra: { readonly lax: boolean; readonly literal: Literal } | null
    readonly loc: Location | null
}

/**
 * All type's data have the same shape: { name, val, extra, loc }
 */

export interface EnumVal {
    readonly name: string
    readonly val: number
    readonly comment: string | null
    readonly extra: null
    readonly loc: Location | null
}

export interface Length {
    readonly name: null
    readonly val: number
    readonly comment: null
    readonly extra: null
    readonly loc: Location | null
}

export interface StructField {
    readonly name: string
    readonly val: null
    readonly comment: string | null
    readonly extra: { readonly mut: boolean; readonly quoted: boolean } | null
    readonly loc: Location | null
}

export interface UnionTag {
    readonly name: null
    readonly val: number
    readonly comment: string | null
    readonly extra: null
    readonly loc: Location | null
}

// Literals

export type LiteralVal = bigint | boolean | null | number | string | undefined

/**
 * JSON representation of a literal type
 */
export type Literal =
    // bigint values are not serializable,
    // thus we use a string of digits to represent the number. e.g. "10".
    | { type: "bigint"; val: string }
    | { type: "number"; val: number }
    | { type: "string"; val: string }
    // `type` is the literal value, `val` has no meaning
    | { type: "false"; val: null }
    | { type: "null"; val: null }
    | { type: "true"; val: null }
    | { type: "undefined"; val: null }

export const NULL_LITERAL_VAL = { type: "null", val: null } as const
export const UNDEFINED_LITERAL_VAL = { type: "undefined", val: null } as const

export function literalVal(literal: Literal): LiteralVal {
    switch (literal.type) {
        case "bigint":
            return BigInt(literal.val)
        case "number":
        case "string":
            return literal.val
        case "false":
            return false
        case "null":
            return null
        case "true":
            return true
        case "undefined":
            return undefined
    }
}

// Utility functions and types

export type BaseTag = typeof BASE_TAG[number]

export function isBaseTag(tag: string): tag is BaseTag {
    return BASE_TAG_SET.has(tag)
}

export function isBaseType(type: Type): type is BaseType {
    return isBaseTag(type.tag)
}

export function isBaseOrVoidType(type: Type): type is BaseType | VoidType {
    return isBaseType(type) || type.tag === "void"
}

export type FixedNumericTag = typeof FIXED_NUMERIC_TAG[number]

export function isFixedNumericTag(tag: string): tag is FixedNumericTag {
    return FIXED_NUMERIC_TAG_SET.has(tag)
}

export const FIXED_NUMERIC_TAG = [
    "f32",
    "f64",
    "i8",
    "i16",
    "i32",
    "i64",
    "u8",
    "u16",
    "u32",
    "u64",
] as const

export const NUMERIC_TAG = [...FIXED_NUMERIC_TAG, "int", "uint"] as const

export const BASE_TAG = [...NUMERIC_TAG, "bool", "str"] as const

const FIXED_NUMERIC_TAG_SET: ReadonlySet<string> = new Set(FIXED_NUMERIC_TAG)

const BASE_TAG_SET: ReadonlySet<string> = new Set(BASE_TAG)

export const FIXED_NUMERIC_TYPE_TO_TYPED_ARRAY = {
    "f32": "Float32Array",
    "f64": "Float64Array",
    "i8": "Int8Array",
    "i16": "Int16Array",
    "i32": "Int32Array",
    "i64": "BigInt64Array",
    "u8": "Uint8Array",
    "u16": "Uint16Array",
    "u32": "Uint32Array",
    "u64": "BigUint64Array",
} as const

export function maxVal(data: readonly (EnumVal | UnionTag)[]): number {
    return data.reduce((max, v) => Math.max(max, v.val), 0)
}

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
        const aliasedType = symbols.get(type.data)
        if (aliasedType !== undefined) {
            return resolveAlias(aliasedType.type, symbols)
        }
    }
    return type
}

/**
 * @param defs
 * @returns aliases that are not referred by any types of `defs`.
 */
export function rootAliases(defs: readonly AliasedType[]): readonly string[] {
    const referred = new Set(defs.flatMap((x) => referredAliases(x.type)))
    return defs.filter((x) => !referred.has(x.alias)).map((x) => x.alias)
}

/**
 * @param type
 * @returns all aliases present in the tree represented by `type`.
 */
function referredAliases(type: Type): readonly string[] {
    if (type.tag === "alias") {
        return [type.data]
    } else if (type.types !== null) {
        return type.types.flatMap((t) => referredAliases(t))
    }
    return []
}

export function typeofValue(type: BaseType): string {
    switch (type.tag) {
        case "bool":
            return "boolean"
        case "str":
            return "string"
        case "i64":
        case "int":
        case "u64":
        case "uint":
            return type.extra?.safe ? "number" : "bigint"
    }
    return "number"
}

/**
 * @param structs
 * @return if the first field of every struct discriminates these structs in
 *  a union, then the returned value is their discriminators. Otherwise the
 *  result is null.
 */
export function leadingDiscriminators(
    structs: readonly StructType[],
): LiteralVal[] | null {
    if (structs.length > 0) {
        const literals: Set<LiteralVal> = new Set()
        const type0LeadingField = structs[0].data[0]
        for (const struct of structs) {
            const fields = struct.data
            // FIXME: extra.literal.val is no longer the literal value...
            if (
                fields.length === 0 ||
                fields[0].name !== type0LeadingField.name ||
                struct.types[0].tag !== "void" ||
                struct.types[0].extra === null ||
                struct.types[0].extra.lax ||
                literals.has(literalVal(struct.types[0].extra.literal))
            ) {
                return null
            }
            literals.add(literalVal(struct.types[0].extra.literal))
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
    types: readonly (BaseType | VoidType)[],
): boolean {
    const typeofValues = types.map((t) =>
        isBaseType(t) ? typeofValue(t) : null,
    ) // null for 'object' or 'undefined'
    return types.length === new Set(typeofValues).size
}

/**
 * Recursively traverse the ast and set `loc` to null
 * @param type
 * @returns type with all `loc` set to null
 */
export function withoutLoc(type: Type): Type {
    return JSON.parse(
        JSON.stringify(type, (name, val) => (name === "loc" ? null : val)),
    )
}

/**
 * Recursively traverse the ast and set `comment`, `extra`, and `loc` to null
 * @param type
 * @returns type with all `comment`, `extra` and `loc` set to null
 */
export function withoutTrivia(type: Type): Type {
    return JSON.parse(
        JSON.stringify(type, (name, val) =>
            name === "comment" || name === "extra" || name === "loc"
                ? null
                : val,
        ),
    )
}
