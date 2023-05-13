import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    FLUID = "FLUID",
}

export function readGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.readUintSafe(bc)
    switch (tag) {
        case 1:
            return Gender.MALE
        case 2:
            return Gender.FEMALE
        case 9007199254740991:
            return Gender.FLUID
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc: bare.ByteCursor, x: Gender): void {
    switch (x) {
        case Gender.MALE: {
            bare.writeU8(bc, 1)
            break
        }
        case Gender.FEMALE: {
            bare.writeU8(bc, 2)
            break
        }
        case Gender.FLUID: {
            bare.writeUintSafe(bc, 9007199254740991)
            break
        }
    }
}

export function encodeGender(x: Gender): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeGender(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeGender(bytes: Uint8Array): Gender {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readGender(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
