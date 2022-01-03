import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

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

export type UnsignedInt = 
    | u8
    | u16
    | u32
    | u64

export function decodeUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0:
            return (bare.decodeU8)(bc)
        case 1:
            return (bare.decodeU16)(bc)
        case 2:
            return (bare.decodeU32)(bc)
        case 3:
            return (bare.decodeU64)(bc)
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void {
    const tag = ext.tagUnsignedInt(x);
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (bare.encodeU8)(bc, x as any)
            break
        case 1:
            (bare.encodeU16)(bc, x as any)
            break
        case 2:
            (bare.encodeU32)(bc, x as any)
            break
        case 3:
            (bare.encodeU64)(bc, x as any)
            break
    }
}
