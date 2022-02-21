import * as bare from "@bare-ts/lib"

export type i64 = bigint
export type u64 = bigint

export type I64 = i64

export function readI64(bc: bare.ByteCursor): I64

export function writeI64(bc: bare.ByteCursor, x: I64): void

export type U64 = u64

export function readU64(bc: bare.ByteCursor): U64

export function writeU64(bc: bare.ByteCursor, x: U64): void
