import assert from "assert"
import * as bare from "@bare-ts/lib"

export type U8Alias = ArrayBuffer

export function readU8Alias(bc: bare.ByteCursor): U8Alias {
    return bare.readFixedData(bc, 4)
}

export function writeU8Alias(bc: bare.ByteCursor, x: U8Alias): void {
    assert(x.byteLength === 4)
    bare.writeFixedData(bc, x)
}
