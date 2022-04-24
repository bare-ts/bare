import * as bare from "@bare-ts/lib"

export type u8 = number

export type U8 =
    | { readonly tag: 0; readonly val: u8 }

export function readU8(bc: bare.ByteCursor): U8 {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeU8(bc: bare.ByteCursor, x: U8): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}
