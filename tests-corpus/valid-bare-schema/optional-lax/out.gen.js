import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readMaybeBool(bc) {
    return bare.readBool(bc)
        ? bare.readBool(bc)
        : null
}

export function writeMaybeBool(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        bare.writeBool(bc, x)
    }
}

export function encodeMaybeBool(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeMaybeBool(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMaybeBool(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readMaybeBool(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
