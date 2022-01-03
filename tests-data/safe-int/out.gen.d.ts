import * as bare from "@bare-ts/lib"

export type f32 = number
export type f64 = number
export type i8 = number
export type i16 = number
export type i32 = number
export type i64 = bigint
export type i64Safe = number
export type int = bigint
export type intSafe = number
export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint
export type u64Safe = number
export type uint = bigint
export type uintSafe = number

export type I64 = i64Safe

export function decodeI64(bc: bare.ByteCursor): I64

export function encodeI64(bc: bare.ByteCursor, x: I64): void

export type U64 = u64Safe

export function decodeU64(bc: bare.ByteCursor): U64

export function encodeU64(bc: bare.ByteCursor, x: U64): void
