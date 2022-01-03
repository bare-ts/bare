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

export type UnsignedInt = 
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 1; readonly val: u16 }
    | { readonly tag: 2; readonly val: u32 }
    | { readonly tag: 3; readonly val: u64Safe }
    | { readonly tag: 4; readonly val: undefined }

export function decodeUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0: {
            const val = (bare.decodeU8)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (bare.decodeU16)(bc)
            return { tag, val }
        }
        case 2: {
            const val = (bare.decodeU32)(bc)
            return { tag, val }
        }
        case 3: {
            const val = (bare.decodeU64Safe)(bc)
            return { tag, val }
        }
        case 4: {
            const val = (bare.decodeVoid)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (bare.encodeU8)(bc, x.val)
            break
        case 1:
            (bare.encodeU16)(bc, x.val)
            break
        case 2:
            (bare.encodeU32)(bc, x.val)
            break
        case 3:
            (bare.encodeU64Safe)(bc, x.val)
            break
        case 4:
            (bare.encodeVoid)(bc, x.val)
            break
    }
}
