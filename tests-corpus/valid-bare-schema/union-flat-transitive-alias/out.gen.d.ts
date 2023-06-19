import * as bare from "@bare-ts/lib"

export type u32 = number

export declare class BoxedU32 {
    readonly val: u32
    constructor(
        val_: u32,
    )
}

export function readBoxedU32(bc: bare.ByteCursor): BoxedU32

export function writeBoxedU32(bc: bare.ByteCursor, x: BoxedU32): void

export declare class BoxedStr {
    readonly val: string
    constructor(
        val_: string,
    )
}

export function readBoxedStr(bc: bare.ByteCursor): BoxedStr

export function writeBoxedStr(bc: bare.ByteCursor, x: BoxedStr): void

export type BoxedTransStr = BoxedStr

export function readBoxedTransStr(bc: bare.ByteCursor): BoxedTransStr

export function writeBoxedTransStr(bc: bare.ByteCursor, x: BoxedTransStr): void

export type Boxed =
    | { readonly tag: "BoxedU32"; readonly val: BoxedU32 }
    | { readonly tag: "BoxedTransStr"; readonly val: BoxedTransStr }

export function readBoxed(bc: bare.ByteCursor): Boxed

export function writeBoxed(bc: bare.ByteCursor, x: Boxed): void

export function encodeBoxed(x: Boxed, config?: Partial<bare.Config>): Uint8Array

export function decodeBoxed(bytes: Uint8Array): Boxed
