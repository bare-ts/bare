import * as bare from "@bare-ts/lib"

export function readAlias(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readAlias1(bc) }
        case 1:
            return { tag, val: readAlias2(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeAlias(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0: {
            writeAlias1(bc, x.val)
            break
        }
        case 1: {
            writeAlias2(bc, x.val)
            break
        }
    }
}

export function readAlias1(bc) {
    return readAlias(bc)
}

export function writeAlias1(bc, x) {
    writeAlias(bc, x)
}

export function readAlias2(bc) {
    return bare.readU8(bc)
}

export function writeAlias2(bc, x) {
    bare.writeU8(bc, x)
}
