import * as bare from "@bare-ts/lib"

export type MultiList = readonly (readonly (readonly string[])[])[]

export function readMultiList(bc: bare.ByteCursor): MultiList

export function writeMultiList(bc: bare.ByteCursor, x: MultiList): void

export function encodeMultiList(x: MultiList, config?: Partial<bare.Config>): Uint8Array

export function decodeMultiList(bytes: Uint8Array): MultiList
