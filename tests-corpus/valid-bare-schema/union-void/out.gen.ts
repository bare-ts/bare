import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number
export type u32 = number
export type u64Safe = number

export type UnsignedInt = 
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 1; readonly val: u16 }
    | { readonly tag: 2; readonly val: u32 }
    | { readonly tag: 3; readonly val: u64Safe }
    | { readonly tag: 4; readonly val: null }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        case 1:
            return { tag, val: bare.readU16(bc) }
        case 2:
            return { tag, val: bare.readU32(bc) }
        case 3:
            return { tag, val: bare.readU64Safe(bc) }
        case 4:
            return { tag, val: null }
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
        case 1:
            bare.writeU16(bc, x.val)
            break
        case 2:
            bare.writeU32(bc, x.val)
            break
        case 3:
            bare.writeU64Safe(bc, x.val)
            break
    }
}
