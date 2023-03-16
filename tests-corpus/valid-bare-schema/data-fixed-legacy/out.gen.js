import * as bare from "@bare-ts/lib"
import assert from "node:assert"

const config = /* @__PURE__ */ bare.Config({})

export function readData(bc) {
    return bare.readFixedData(bc, 16)
}

export function writeData(bc, x) {
    assert(x.byteLength === 16)
    bare.writeFixedData(bc, x)
}

export function encodeData(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeData(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeData(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readData(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
