import * as bare from "@bare-ts/lib"

export type u32 = number

export declare class BoxedU32 {
    readonly val: u32
    constructor(
        val: u32,
    )
}

export function readBoxedU32(bc: bare.ByteCursor): BoxedU32

export function writeBoxedU32(bc: bare.ByteCursor, x: BoxedU32): void

export declare class BoxedString {
    readonly val: string
    constructor(
        val: string,
    )
}

export function readBoxedString(bc: bare.ByteCursor): BoxedString

export function writeBoxedString(bc: bare.ByteCursor, x: BoxedString): void

export type Boxed = 
    | BoxedU32
    | BoxedString

export function readBoxed(bc: bare.ByteCursor): Boxed

export function writeBoxed(bc: bare.ByteCursor, x: Boxed): void