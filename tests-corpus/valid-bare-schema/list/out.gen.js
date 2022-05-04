import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readU8List(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readU8(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU8(bc)
    }
    return result
}

export function writeU8List(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeU8(bc, x[i])
    }
}

export function encodeU8List(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU8List(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8List(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8List(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
