import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export enum Gender {
    FLUID = 0,
    MALE = 1,
    FEMALE = 2,
}

export function readGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    if (tag > 2) {
        bc.offset = offset
        throw new bare.BareError(offset, "invalid tag")
    }
    return tag as Gender
}

export function writeGender(bc: bare.ByteCursor, x: Gender): void {
    bare.writeU8(bc, x)
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
