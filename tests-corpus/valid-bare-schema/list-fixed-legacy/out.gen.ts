import * as bare from "@bare-ts/lib"
import assert from "node:assert"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number

export type U8Array = readonly u8[]

export function readU8Array(bc: bare.ByteCursor): U8Array {
    const len = 4
    const result = [bare.readU8(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU8(bc)
    }
    return result
}

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        bare.writeU8(bc, x[i])
    }
}

export function encodeU8Array(x: U8Array): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeU8Array(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Array(bytes: Uint8Array): U8Array {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
