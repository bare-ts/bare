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
    | { readonly tag: 5; readonly val: u16 }
    | { readonly tag: 6; readonly val: u32 }
    | { readonly tag: 7; readonly val: u64 }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (bare.readU8)(bc)
            return { tag, val }
        }
        case 5: {
            const val = (bare.readU16)(bc)
            return { tag, val }
        }
        case 6: {
            const val = (bare.readU32)(bc)
            return { tag, val }
        }
        case 7: {
            const val = (bare.readU64)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (bare.writeU8)(bc, x.val)
            break
        case 5:
            (bare.writeU16)(bc, x.val)
            break
        case 6:
            (bare.writeU32)(bc, x.val)
            break
        case 7:
            (bare.writeU64)(bc, x.val)
            break
    }
}
