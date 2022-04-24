import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint

export type UnsignedInt =
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 5; readonly val: u16 }
    | { readonly tag: 6; readonly val: u32 }
    | { readonly tag: 7; readonly val: u64 }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void
