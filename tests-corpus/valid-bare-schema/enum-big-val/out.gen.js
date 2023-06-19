import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export const Gender = {
    Male: "Male",
    Female: "Female",
    Fluid: "Fluid",
}

export function readGender(bc) {
    const offset = bc.offset
    const tag = bare.readUintSafe(bc)
    switch (tag) {
        case 1:
            return Gender.Male
        case 2:
            return Gender.Female
        case 9007199254740991:
            return Gender.Fluid
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc, x) {
    switch (x) {
        case Gender.Male: {
            bare.writeU8(bc, 1)
            break
        }
        case Gender.Female: {
            bare.writeU8(bc, 2)
            break
        }
        case Gender.Fluid: {
            bare.writeUintSafe(bc, 9007199254740991)
            break
        }
    }
}

export function encodeGender(x, config = DEFAULT_CONFIG) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeGender(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeGender(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readGender(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
