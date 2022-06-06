import * as bare from "@bare-ts/lib"

function read0(bc) {
    return bare.readBool(bc)
        ? readAlias(bc)
        : null
}

function write0(bc, x) {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        writeAlias(bc, x)
    }
}

export function readAlias(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: read0(bc) }
        case 1:
            return { tag, val: bare.readString(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeAlias(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            write0(bc, x.val)
            break
        case 1:
            bare.writeString(bc, x.val)
            break
    }
}
