import * as bare from "@bare-ts/lib"


export function readUnsignedInt(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (bare.readU8)(bc)
            return { tag, val }
        }
        case 5: {
            const val = (bare.readU16)(bc)
            return { tag, val }
        }
        case 6: {
            const val = (bare.readU32)(bc)
            return { tag, val }
        }
        case 7: {
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
    const tag = x.tag;
    bare.writeU8(bc, tag)
    switch (tag) {
        case 0:
            (bare.writeU8)(bc, x.val)
            break
        case 5:
            (bare.writeU16)(bc, x.val)
            break
        case 6:
            (bare.writeU32)(bc, x.val)
            break
        case 7:
            (bare.writeU64)(bc, x.val)
            break
    }
}
