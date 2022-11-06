import * as bare from "@bare-ts/lib"

export type u32 = number

export type BoxedU32 = {
    readonly tag: "BOXED_U32"
    readonly val: u32
}

export function readBoxedU32(bc: bare.ByteCursor): BoxedU32

export function writeBoxedU32(bc: bare.ByteCursor, x: BoxedU32): void

export type BoxedStr = {
    readonly tag: "BOXED_STR"
    readonly val: string
}

export function readBoxedStr(bc: bare.ByteCursor): BoxedStr

export function writeBoxedStr(bc: bare.ByteCursor, x: BoxedStr): void

export type Boxed =
    | BoxedU32
    | BoxedStr

export function readBoxed(bc: bare.ByteCursor): Boxed

export function writeBoxed(bc: bare.ByteCursor, x: Boxed): void

export function encodeBoxed(x: Boxed): Uint8Array

export function decodeBoxed(bytes: Uint8Array): Boxed
