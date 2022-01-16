import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"


export function readUnsignedInt(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return (bare.readU8)(bc)
        case 1:
            return (bare.readU16)(bc)
        case 2:
            return (bare.readU32)(bc)
        case 3:
            return (bare.readU64)(bc)
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc, x) {
    const tag = ext.tagUnsignedInt(x);
    bare.writeU8(bc, tag)
    switch (tag) {
        case 0:
            (bare.writeU8)(bc, x)
            break
        case 1:
            (bare.writeU16)(bc, x)
            break
        case 2:
            (bare.writeU32)(bc, x)
            break
        case 3:
            (bare.writeU64)(bc, x)
            break
    }
}
