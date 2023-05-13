import * as bare from "@bare-ts/lib"
import assert from "node:assert"

const config = /* @__PURE__ */ bare.Config({})

export function readU8Array(bc) {
    return bare.readU8FixedArray(bc, 4)
}

export function writeU8Array(bc, x) {
    assert(x.length === 4)
    bare.writeU8FixedArray(bc, x)
}

export function encodeU8Array(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeU8Array(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Array(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
