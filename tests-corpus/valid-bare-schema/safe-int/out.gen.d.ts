import * as bare from "@bare-ts/lib"

export type i64Safe = number
export type u64Safe = number

export type I64 = i64Safe

export function readI64(bc: bare.ByteCursor): I64

export function writeI64(bc: bare.ByteCursor, x: I64): void

export type U64 = u64Safe

export function readU64(bc: bare.ByteCursor): U64

export function writeU64(bc: bare.ByteCursor, x: U64): void
