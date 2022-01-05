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

export type MultiArray = readonly (readonly (readonly (string)[])[])[]

export function decodeMultiArray(bc: bare.ByteCursor): MultiArray {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decode0
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeMultiArray(bc: bare.ByteCursor, x: MultiArray): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (encode0)(bc, x[i])
    }
}

function decode0(bc: bare.ByteCursor): readonly (readonly (string)[])[] {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decode1
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode0(bc: bare.ByteCursor, x: readonly (readonly (string)[])[]): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (encode1)(bc, x[i])
    }
}

function decode1(bc: bare.ByteCursor): readonly (string)[] {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = bare.decodeString
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode1(bc: bare.ByteCursor, x: readonly (string)[]): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.encodeString)(bc, x[i])
    }
}
