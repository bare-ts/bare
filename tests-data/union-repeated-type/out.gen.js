import * as bare from "@bare-ts/lib"


export function readX(bc) {
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

export function writeX(bc, x) {
    const tag = x.tag;
    bare.writeU8(bc, tag)
    switch (tag) {
        case 0:
            (bare.writeU8)(bc, x.val)
            break
        case 1:
            (bare.writeU8)(bc, x.val)
            break
    }
}
