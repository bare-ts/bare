import * as bare from "@bare-ts/lib"

export type U64List = BigUint64Array

export function readU64List(bc: bare.ByteCursor): U64List

export function writeU64List(bc: bare.ByteCursor, x: U64List): void

export function encodeU64List(x: U64List, config?: Partial<bare.Config>): Uint8Array

export function decodeU64List(bytes: Uint8Array): U64List
