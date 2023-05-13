import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readU64List(bc) {
    return bare.readU64Array(bc)
}

export function writeU64List(bc, x) {
    bare.writeU64Array(bc, x)
}

export function encodeU64List(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeU64List(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU64List(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU64List(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
