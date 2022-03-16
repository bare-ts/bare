import assert from "assert"
import * as bare from "@bare-ts/lib"

export type Data = ArrayBuffer

export function readData(bc: bare.ByteCursor): Data {
    return bare.readFixedData(bc, 16)
}

export function writeData(bc: bare.ByteCursor, x: Data): void {
    assert(x.byteLength === 16)
    bare.writeFixedData(bc, x)
}
