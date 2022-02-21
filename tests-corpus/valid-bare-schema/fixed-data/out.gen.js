import assert from "assert"
import * as bare from "@bare-ts/lib"

export function readU8Alias(bc) {
    return bare.readFixedData(bc, 4)
}

export function writeU8Alias(bc, x) {
    assert(x.byteLength === 4)
    bare.writeFixedData(bc, x)
}
