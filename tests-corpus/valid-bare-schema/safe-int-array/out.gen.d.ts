import * as bare from "@bare-ts/lib"

export type u64Safe = number

export type U64Array = readonly (u64Safe)[]

export function readU64Array(bc: bare.ByteCursor): U64Array

export function writeU64Array(bc: bare.ByteCursor, x: U64Array): void
