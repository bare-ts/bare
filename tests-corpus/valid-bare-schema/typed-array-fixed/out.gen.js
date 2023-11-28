import assert from "node:assert/strict"
import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readU8Array(bc) {
    return bare.readU8FixedArray(bc, 4)
}

export function writeU8Array(bc, x) {
    assert(x.length === 4)
    bare.writeU8FixedArray(bc, x)
}

export function encodeU8Array(x, config = DEFAULT_CONFIG) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeU8Array(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Array(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readU8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
