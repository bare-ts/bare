import assert from "assert"
import * as bare from "@bare-ts/lib"

export function readU8Array(bc) {
    const len = 4
    const result = [bare.readU8(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU8(bc)
    }
    return result
}

export function writeU8Array(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        bare.writeU8(bc, x[i])
    }
}