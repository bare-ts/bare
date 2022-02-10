import * as bare from "@bare-ts/lib"

export const readY = bare.readU8

export const writeY = bare.writeU8

export function readX(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (bare.readU8)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (readY)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeX(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (bare.writeU8)(bc, x.val)
            break
        case 1:
            (writeY)(bc, x.val)
            break
    }
}
