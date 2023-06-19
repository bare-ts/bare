import * as bare from "@bare-ts/lib"

export type U8Array = Uint8Array

export function readU8Array(bc: bare.ByteCursor): U8Array

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void

export function encodeU8Array(x: U8Array, config?: Partial<bare.Config>): Uint8Array

export function decodeU8Array(bytes: Uint8Array): U8Array
