//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

/**
 * The AST is serializable in JSON.
 *
 * The serialization preserves the AST structure and its data types.
 * This makes serialization and deserialization bijective:
 *
 * ```ts
 * (x: Ast) => assert.deepEqual(x, JSON.parse(JSON.stringify(x)))
 * ```
 *
 * To achieve this, the AST use `null` instead of `undefined` and
 * use dedicated representations for types that cannot be serialized.
 */
export type Ast = {
    readonly defs: readonly AliasedType[]
    readonly filename: string | number | null
    readonly offset: number
}

export type AliasedType = {
    readonly alias: string
    // The normalization phase uses this to create internal-only aliases.
    readonly internal: boolean
    readonly comment: string
    readonly type: Type
    readonly offset: number
}

/**
 * All types have the same object's shape: { tag, data, types, extra, offset }
 *
 * - `tag` discriminates the type
 * - `data` contains type-specific info
 * - `types` contains nested types
 * - `extra` contains information that are not part of BARE specification
 * - `offset` is the number of the AST node in the source
 */
export type Type =
    | Alias // Named user type
    | BaseType
    | DataType // data, data<length>
    | EnumType
    | ListType // []type, [n]type
    | MapType // map[type]type
    | OptionalType // optional<type>
    | StructType // { fields... }
    | UnionType // (type | ...)
    | VoidType // void

export type Alias = {
    readonly tag: "alias"
    readonly data: string
    readonly types: null
    readonly extra: null
    readonly offset: number
}

export type BaseType = {
    readonly tag: BaseTag
    readonly data: null
    readonly types: null
    readonly extra: { readonly safe: boolean } | null
    readonly offset: number
}

export type DataType = {
    readonly tag: "data"
    readonly data: Length | null
    readonly types: null
    readonly extra: { readonly mut: boolean } | null
    readonly offset: number
}

export type EnumType = {
    readonly tag: "enum"
    readonly data: readonly EnumVal[]
    readonly types: null
    readonly extra: { readonly intEnum: boolean } | null
    readonly offset: number
}

export type ListType = {
    readonly tag: "list"
    readonly data: Length | null
    readonly types: readonly [valType: Type]
    readonly extra: {
        readonly mut: boolean
        readonly typedArray: boolean
        readonly unique: boolean
    } | null
    readonly offset: number
}

export type MapType = {
    readonly tag: "map"
    readonly data: null
    readonly types: readonly [keyType: Type, valType: Type]
    readonly extra: { readonly mut: boolean } | null
    readonly offset: number
}

export type OptionalType = {
    readonly tag: "optional"
    readonly data: null
    readonly types: readonly [type: Type]
    readonly extra: { readonly literal: Literal } | null
    readonly offset: number
}

export type StructType = {
    readonly tag: "struct"
    readonly data: readonly StructField[]
    readonly types: readonly Type[]
    readonly extra: { readonly class: boolean } | null
    readonly offset: number
}

export type UnionType = {
    readonly tag: "union"
    readonly data: readonly UnionTag[]
    readonly types: readonly Type[]
    readonly extra: { readonly flat: boolean } | null
    readonly offset: number
}

export type VoidType = {
    readonly tag: "void"
    readonly data: null
    readonly types: null
    readonly extra: { readonly literal: Literal } | null
    readonly offset: number
}

// All type's data have the same shape: { name, val, comment, extra, offset }

export type EnumVal = {
    readonly name: string
    readonly val: number
    readonly comment: string
    readonly extra: null
    readonly offset: number
}

export type Length = {
    readonly name: null
    readonly val: number
    readonly comment: null
    readonly extra: null
    readonly offset: number
}

export type StructField = {
    readonly name: string
    readonly val: null
    readonly comment: string
    readonly extra: { readonly mut: boolean } | null
    readonly offset: number
}

export type UnionTag = {
    readonly name: null
    readonly val: number
    readonly comment: string
    readonly extra: null
    readonly offset: number
}

// Literals

export type LiteralVal = bigint | boolean | null | number | string | undefined

/**
 * JSON-serializable representation of a literal type.
 */
export type Literal =
    // bigint values are not serializable,
    // thus we use a string of digits to represent the number. e.g. "10".
    | { type: "bigint"; val: string }
    | { type: "number"; val: number }
    | { type: "string"; val: string }
    // `type` is the literal value, `val` has no meaning
    | { type: "false"; val: null }
    | typeof NULL_LITERAL_VAL
    | { type: "true"; val: null }
    | typeof UNDEFINED_LITERAL_VAL

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

export type BaseTag = (typeof NUMERIC_TAG)[number] | "bool" | "str"

export function isBaseTag(tag: string): tag is BaseTag {
    return BASE_TAG_SET.has(tag)
}

export function isBaseType(type: Type): type is BaseType {
    return isBaseTag(type.tag)
}

export function isBaseOrVoidType(type: Type): type is BaseType | VoidType {
    return isBaseType(type) || type.tag === "void"
}

export type FixedNumericTag =
    | "f32"
    | "f64"
    | "i8"
    | "i16"
    | "i32"
    | "i64"
    | "u8"
    | "u16"
    | "u32"
    | "u64"

export function isFixedNumericTag(tag: string): tag is FixedNumericTag {
    return FIXED_NUMERIC_TYPE_TO_TYPED_ARRAY.has(tag)
}

export const NUMERIC_TAG = [
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
    "int",
    "uint",
] as const

const BASE_TAG_SET: ReadonlySet<string> = new Set([
    ...NUMERIC_TAG,
    "bool",
    "str",
])

export const FIXED_NUMERIC_TYPE_TO_TYPED_ARRAY: Map<string, string> = new Map([
    ["f32", "Float32Array"],
    ["f64", "Float64Array"],
    ["i8", "Int8Array"],
    ["i16", "Int16Array"],
    ["i32", "Int32Array"],
    ["i64", "BigInt64Array"],
    ["u8", "Uint8Array"],
    ["u16", "Uint16Array"],
    ["u32", "Uint32Array"],
    ["u64", "BigUint64Array"],
])

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
        if (aliasedType != null) {
            return resolveAlias(aliasedType.type, symbols)
        }
    }
    return type
}

/**
 * Aliases that are not referred by any types of `defs`.
 */
export function rootAliases(defs: readonly AliasedType[]): readonly string[] {
    const referred = new Set(defs.flatMap((x) => referredAliases(x.type)))
    return defs.filter((x) => !referred.has(x.alias)).map((x) => x.alias)
}

/**
 * All aliases present in the tree represented by `type`.
 */
function referredAliases(type: Type): readonly string[] {
    if (type.tag === "alias") {
        return [type.data]
    }
    if (type.types != null) {
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
 * If the first field of every struct discriminates these structs in a union,
 * then the returned value is their discriminators.
 * Otherwise the result is null.
 */
export function leadingDiscriminators(
    structs: readonly StructType[],
): LiteralVal[] | null {
    if (structs.length > 0) {
        const literals: Set<LiteralVal> = new Set()
        const type0LeadingField = structs[0].data[0]
        for (const struct of structs) {
            const fields = struct.data
            if (
                fields.length === 0 ||
                fields[0].name !== type0LeadingField.name ||
                struct.types[0].tag !== "void" ||
                struct.types[0].extra == null ||
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
 * Have `types` distinct `typeof` values?
 */
export function haveDistinctTypeof(types: readonly Type[]): boolean {
    const typeofValues = types.map((t) =>
        isBaseType(t) ? typeofValue(t) : null,
    ) // null for 'object' or 'undefined'
    return types.length === new Set(typeofValues).size
}

/**
 * Recursively traverse `type` and set `offset` to 0.
 *
 * This allows comparing types between them regardless their `offset`.
 */
export function withoutOffset(type: Type): Type {
    return JSON.parse(
        JSON.stringify(type, (name, val) => (name === "offset" ? 0 : val)),
    )
}

/**
 * Recursively traverse `type`,
 * and set `comment` to the empty string, `extra` to `null`, `offset` to 0.
 *
 * This allows comparing types between them considering only their BARE properties.
 */
export function withoutExtra(type: Type): Type {
    return JSON.parse(
        JSON.stringify(type, (name, val) =>
            name === "comment"
                ? ""
                : name === "extra"
                  ? null
                  : name === "offset"
                    ? 0
                    : val,
        ),
    )
}
