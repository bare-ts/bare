import * as bare from "@bare-ts/lib"
import assert from "node:assert"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export type U8Array = Uint8Array

export function readU8Array(bc: bare.ByteCursor): U8Array {
    return bare.readU8FixedArray(bc, 4)
}

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    assert(x.length === 4)
    bare.writeU8FixedArray(bc, x)
}

export function encodeU8Array(x: U8Array, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeU8Array(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Array(bytes: Uint8Array): U8Array {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readU8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
