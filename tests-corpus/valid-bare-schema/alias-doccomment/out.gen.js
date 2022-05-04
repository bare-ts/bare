import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readU8Alias(bc) {
    return bare.readU8(bc)
}

export function writeU8Alias(bc, x) {
    bare.writeU8(bc, x)
}

export function encodeU8Alias(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU8Alias(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Alias(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8Alias(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export function readU8Alias2(bc) {
    return bare.readU8(bc)
}

export function writeU8Alias2(bc, x) {
    bare.writeU8(bc, x)
}

export function encodeU8Alias2(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU8Alias2(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Alias2(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8Alias2(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
