import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint

export type UnsignedInt =
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 5; readonly val: u16 }
    | { readonly tag: 6; readonly val: u32 }
    | { readonly tag: 7; readonly val: u64 }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        case 5:
            return { tag, val: bare.readU16(bc) }
        case 6:
            return { tag, val: bare.readU32(bc) }
        case 7:
            return { tag, val: bare.readU64(bc) }
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
            bare.writeU8(bc, x.val)
            break
        case 5:
            bare.writeU16(bc, x.val)
            break
        case 6:
            bare.writeU32(bc, x.val)
            break
        case 7:
            bare.writeU64(bc, x.val)
            break
    }
}
