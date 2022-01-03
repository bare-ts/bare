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

export enum Gender {
    FLUID,
    MALE,
    FEMALE,
}

export function decodeGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    if (tag > 2) {
        bc.offset = offset
        throw new bare.BareError(offset, "invalid tag")
    }
    return tag as Gender
}

export function encodeGender(bc: bare.ByteCursor, x: Gender): void {
    bare.encodeU8(bc, x)
}
