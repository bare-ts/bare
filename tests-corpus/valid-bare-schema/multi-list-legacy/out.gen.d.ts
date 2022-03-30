import * as bare from "@bare-ts/lib"

export type MultiList = readonly (readonly (readonly string[])[])[]

export function readMultiList(bc: bare.ByteCursor): MultiList

export function writeMultiList(bc: bare.ByteCursor, x: MultiList): void
