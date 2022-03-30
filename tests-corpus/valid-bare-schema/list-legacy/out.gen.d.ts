import * as bare from "@bare-ts/lib"

export type u8 = number

export type U8List = readonly u8[]

export function readU8List(bc: bare.ByteCursor): U8List

export function writeU8List(bc: bare.ByteCursor, x: U8List): void
