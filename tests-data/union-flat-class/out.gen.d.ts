import * as bare from "@bare-ts/lib"

export type f32 = number
export type f64 = number
export type i8 = number
export type i16 = number
export type i32 = number
export type i64 = bigint
export type i64Safe = number
export type int = bigint
export type intSafe = number
export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint
export type u64Safe = number
export type uint = bigint
export type uintSafe = number

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
