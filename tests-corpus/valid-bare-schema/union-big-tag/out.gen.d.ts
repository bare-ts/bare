import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint

/**
 * last tag is Number.MAX_SAFE_INTEGER
 */
export type UnsignedInt =
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 1; readonly val: u16 }
    | { readonly tag: 2; readonly val: u32 }
    | { readonly tag: 9007199254740991; readonly val: u64 }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void

export function encodeUnsignedInt(x: UnsignedInt, config?: Partial<bare.Config>): Uint8Array

export function decodeUnsignedInt(bytes: Uint8Array): UnsignedInt
