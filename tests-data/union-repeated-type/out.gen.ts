import * as bare from "@bare-ts/lib"

export type u8 = number

export type X = 
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 1; readonly val: u8 }

export function readX(bc: bare.ByteCursor): X {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (bare.readU8)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (bare.readU8)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeX(bc: bare.ByteCursor, x: X): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (bare.writeU8)(bc, x.val)
            break
        case 1:
            (bare.writeU8)(bc, x.val)
            break
    }
}
