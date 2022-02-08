import * as bare from "@bare-ts/lib"


export function readUnsignedInt(bc) {
    const offset = bc.offset
    const tag = bare.readUintSafe(bc)
    switch (tag) {
        case 0: {
            const val = (bare.readU8)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (bare.readU16)(bc)
            return { tag, val }
        }
        case 2: {
            const val = (bare.readU32)(bc)
            return { tag, val }
        }
        case 9007199254740991: {
            const val = (bare.readU64)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc, x) {
    bare.writeUintSafe(bc, x.tag)
    switch (x.tag) {
        case 0:
            (bare.writeU8)(bc, x.val)
            break
        case 1:
            (bare.writeU16)(bc, x.val)
            break
        case 2:
            (bare.writeU32)(bc, x.val)
            break
        case 9007199254740991:
            (bare.writeU64)(bc, x.val)
            break
    }
}
