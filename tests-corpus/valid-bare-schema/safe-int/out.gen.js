import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readI64(bc) {
    return bare.readI64Safe(bc)
}

export function writeI64(bc, x) {
    bare.writeI64Safe(bc, x)
}

export function encodeI64(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeI64(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeI64(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readI64(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export function readU64(bc) {
    return bare.readU64Safe(bc)
}

export function writeU64(bc, x) {
    bare.writeU64Safe(bc, x)
}

export function encodeU64(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU64(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU64(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU64(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
