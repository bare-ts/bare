import assert from "assert"
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

export type U8Array = Uint8Array

export function readU8Array(bc: bare.ByteCursor): U8Array {
    return bare.readU8FixedArray(bc, 4)
}

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    assert(x.length === 4)
    return bare.writeU8FixedArray(bc, x)
}
