import * as bare from "@bare-ts/lib"

export type u64Safe = number

export type U64List = readonly u64Safe[]

export function readU64List(bc: bare.ByteCursor): U64List

export function writeU64List(bc: bare.ByteCursor, x: U64List): void
