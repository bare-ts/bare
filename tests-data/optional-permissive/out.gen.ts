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

export type MaybeBool = boolean | undefined | null

export function readMaybeBool(bc: bare.ByteCursor): MaybeBool {
    return bare.readBool(bc)
        ? (bare.readBool)(bc)
        : undefined
}

export function writeMaybeBool(bc: bare.ByteCursor, x: MaybeBool): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (bare.writeBool)(bc, x)
    }
}
