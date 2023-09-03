import assert from "node:assert"
import * as bare from "@bare-ts/lib"

function read0(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag: "Alias", val: readAlias(bc) }
        case 1:
            return { tag, val: bare.readString(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

function write0(bc, x) {
    switch (x.tag) {
        case "Alias": {
            bare.writeU8(bc, 0)
            writeAlias(bc, x.val)
            break
        }
        case 1: {
            bare.writeString(bc, x.val)
            break
        }
    }
}

export function readAlias(bc) {
    const len = 2
    const result = [read0(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read0(bc)
    }
    return result
}

export function writeAlias(bc, x) {
    assert(x.length === 2, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        write0(bc, x[i])
    }
}
