import * as bare from "@bare-ts/lib"

export type u32 = number

export type UnsignedInt =
    | {
        readonly tag: 0,
        readonly value: string,
    }
    | {
        readonly tag: 1,
        readonly value: u32,
    }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void

export function encodeUnsignedInt(x: UnsignedInt): Uint8Array

export function decodeUnsignedInt(bytes: Uint8Array): UnsignedInt
