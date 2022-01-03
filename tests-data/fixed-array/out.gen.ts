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

export type U8Array = readonly (u8)[]

export function decodeU8Array(bc: bare.ByteCursor): U8Array {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = bare.decodeU8
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (bare.encodeU8)(bc, x[i])
    }
}
