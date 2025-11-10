import * as bare from "@bare-ts/lib"

export function readMaybeBool(bc) {
    return bare.readBool(bc) ? bare.readBool(bc) : null
}

export function writeMaybeBool(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        bare.writeBool(bc, x)
    }
}

export function encodeMaybeBool(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeMaybeBool(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMaybeBool(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readMaybeBool(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
