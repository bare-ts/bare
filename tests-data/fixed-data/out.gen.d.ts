import * as bare from "@bare-ts/lib"

export type U8Alias = ArrayBuffer

export function readU8Alias(bc: bare.ByteCursor): U8Alias

export function writeU8Alias(bc: bare.ByteCursor, x: U8Alias): void
