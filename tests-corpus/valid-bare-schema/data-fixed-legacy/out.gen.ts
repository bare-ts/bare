import assert from "node:assert"
import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export type Data = ArrayBuffer

export function readData(bc: bare.ByteCursor): Data {
    return bare.readFixedData(bc, 16)
}

export function writeData(bc: bare.ByteCursor, x: Data): void {
    assert(x.byteLength === 16)
    bare.writeFixedData(bc, x)
}

export function encodeData(x: Data, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeData(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeData(bytes: Uint8Array): Data {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readData(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
