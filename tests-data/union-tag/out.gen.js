import * as bare from "@bare-ts/lib"


export function decodeUnsignedInt(bc) {
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
        case 99: {
            const val = (bare.decodeU64)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeUnsignedInt(bc, x) {
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
        case 99:
            (bare.encodeU64)(bc, x.val)
            break
    }
}
