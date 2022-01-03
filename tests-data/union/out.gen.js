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
        case 3: {
            const val = (bare.decodeU64Safe)(bc)
            return { tag, val }
        }
        case 4: {
            const val = (bare.decodeUintSafe)(bc)
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
        case 3:
            (bare.encodeU64Safe)(bc, x.val)
            break
        case 4:
            (bare.encodeUintSafe)(bc, x.val)
            break
    }
}
