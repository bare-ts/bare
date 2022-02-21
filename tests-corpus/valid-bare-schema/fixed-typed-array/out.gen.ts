import assert from "assert"
import * as bare from "@bare-ts/lib"

export type U8Array = Uint8Array

export function readU8Array(bc: bare.ByteCursor): U8Array {
    return bare.readU8FixedArray(bc, 4)
}

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    assert(x.length === 4)
    return bare.writeU8FixedArray(bc, x)
}
