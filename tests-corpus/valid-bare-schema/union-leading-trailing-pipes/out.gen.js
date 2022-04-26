import * as bare from "@bare-ts/lib"

export function readLeadingPipe(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeLeadingPipe(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}

export function readTrailingPipe(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeTrailingPipe(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}
