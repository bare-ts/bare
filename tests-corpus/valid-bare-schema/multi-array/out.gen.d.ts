import * as bare from "@bare-ts/lib"

export type MultiArray = readonly (readonly (readonly string[])[])[]

export function readMultiArray(bc: bare.ByteCursor): MultiArray

export function writeMultiArray(bc: bare.ByteCursor, x: MultiArray): void
