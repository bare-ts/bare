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

export function readMultiArray(bc: bare.ByteCursor): MultiArray {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = read0
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeMultiArray(bc: bare.ByteCursor, x: MultiArray): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (write0)(bc, x[i])
    }
}

function read0(bc: bare.ByteCursor): readonly (readonly (string)[])[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = read1
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write0(bc: bare.ByteCursor, x: readonly (readonly (string)[])[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (write1)(bc, x[i])
    }
}

function read1(bc: bare.ByteCursor): readonly (string)[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = bare.readString
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write1(bc: bare.ByteCursor, x: readonly (string)[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.writeString)(bc, x[i])
    }
}
