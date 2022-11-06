import * as bare from "@bare-ts/lib"

export type u8 = number

export type U8 =
    | { readonly tag: 0, readonly val: u8 }

export function readU8(bc: bare.ByteCursor): U8

export function writeU8(bc: bare.ByteCursor, x: U8): void

export function encodeU8(x: U8): Uint8Array

export function decodeU8(bytes: Uint8Array): U8
