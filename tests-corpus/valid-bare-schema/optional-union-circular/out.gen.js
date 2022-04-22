import * as bare from "@bare-ts/lib"

export function readAlias(bc) {
    return bare.readBool(bc)
        ? read0(bc)
        : null
}

export function writeAlias(bc, x) {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        write0(bc, x)
    }
}

function read0(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readAlias(bc) }
        case 1:
            return { tag, val: bare.readString(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

function write0(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            writeAlias(bc, x.val)
            break
        case 1:
            bare.writeString(bc, x.val)
            break
    }
}