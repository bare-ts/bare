import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readU8Array(bc) {
    return bare.readU8Array(bc)
}

export function writeU8Array(bc, x) {
    bare.writeU8Array(bc, x)
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
