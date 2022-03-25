import * as bare from "@bare-ts/lib"

export function readY(bc) {
    return bare.readU8(bc)
}

export function writeY(bc, x) {
    bare.writeU8(bc, x)
}

export function readX(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        case 1:
            return { tag, val: readY(bc) }
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
            bare.writeU8(bc, x.val)
            break
        case 1:
            writeY(bc, x.val)
            break
    }
}
