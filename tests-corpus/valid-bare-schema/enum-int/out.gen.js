import * as bare from "@bare-ts/lib"

export const Gender = {
    Fluid: 0,
    0: "Fluid",
    Male: 1,
    1: "Male",
    Female: 2,
    2: "Female",
}

export function readGender(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    if (tag > 2) {
        bc.offset = offset
        throw new bare.BareError(offset, "invalid tag")
    }
    return tag
}

export function writeGender(bc, x) {
    bare.writeU8(bc, x)
}

export function encodeGender(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeGender(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeGender(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readGender(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
