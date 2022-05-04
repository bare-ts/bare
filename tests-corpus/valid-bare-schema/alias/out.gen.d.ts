import * as bare from "@bare-ts/lib"

export type u8 = number

export type U8Alias = u8

export function readU8Alias(bc: bare.ByteCursor): U8Alias

export function writeU8Alias(bc: bare.ByteCursor, x: U8Alias): void

export function encodeU8Alias(x: U8Alias): Uint8Array

export function decodeU8Alias(bytes: Uint8Array): U8Alias
