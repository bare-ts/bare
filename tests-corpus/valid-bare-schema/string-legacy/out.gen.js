import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readName(bc) {
    return bare.readString(bc)
}

export function writeName(bc, x) {
    bare.writeString(bc, x)
}

export function encodeName(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeName(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeName(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readName(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
