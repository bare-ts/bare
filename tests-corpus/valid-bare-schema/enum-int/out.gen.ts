import * as bare from "@bare-ts/lib"

export enum Gender {
    Fluid = 0,
    Male = 1,
    Female = 2,
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

export function encodeGender(x: Gender, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeGender(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeGender(bytes: Uint8Array): Gender {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readGender(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
