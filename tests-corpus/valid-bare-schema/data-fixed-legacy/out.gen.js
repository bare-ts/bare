import assert from "assert"
import * as bare from "@bare-ts/lib"

export function readData(bc) {
    return bare.readFixedData(bc, 16)
}

export function writeData(bc, x) {
    assert(x.byteLength === 16)
    bare.writeFixedData(bc, x)
}
