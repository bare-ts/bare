import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"


export function decodeUnsignedInt(bc) {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0:
            return (bare.decodeU8)(bc)
        case 1:
            return (bare.decodeU16)(bc)
        case 2:
            return (bare.decodeU32)(bc)
        case 3:
            return (bare.decodeU64)(bc)
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeUnsignedInt(bc, x) {
    const tag = ext.tagUnsignedInt(x);
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (bare.encodeU8)(bc, x)
            break
        case 1:
            (bare.encodeU16)(bc, x)
            break
        case 2:
            (bare.encodeU32)(bc, x)
            break
        case 3:
            (bare.encodeU64)(bc, x)
            break
    }
}
