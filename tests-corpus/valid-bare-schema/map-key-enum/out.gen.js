import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export const Gender = {
    Fluid: "Fluid",
    Male: "Male",
    Female: "Female",
}

export function readGender(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return Gender.Fluid
        case 1:
            return Gender.Male
        case 2:
            return Gender.Female
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc, x) {
    switch (x) {
        case Gender.Fluid: {
            bare.writeU8(bc, 0)
            break
        }
        case Gender.Male: {
            bare.writeU8(bc, 1)
            break
        }
        case Gender.Female: {
            bare.writeU8(bc, 2)
            break
        }
    }
}

export function readGenderNames(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = readGender(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, bare.readString(bc))
    }
    return result
}

export function writeGenderNames(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        writeGender(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeGenderNames(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeGenderNames(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeGenderNames(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readGenderNames(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
