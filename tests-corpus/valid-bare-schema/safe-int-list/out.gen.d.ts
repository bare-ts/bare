import * as bare from "@bare-ts/lib"

export type U64List = BigUint64Array

export function readU64List(bc: bare.ByteCursor): U64List

export function writeU64List(bc: bare.ByteCursor, x: U64List): void
