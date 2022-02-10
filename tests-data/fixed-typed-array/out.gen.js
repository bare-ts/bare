import assert from "assert"
import * as bare from "@bare-ts/lib"

export function readU8Array(bc) {
    return bare.readU8FixedArray(bc, 4)
}

export function writeU8Array(bc, x) {
    assert(x.length === 4)
    return bare.writeU8FixedArray(bc, x)
}
