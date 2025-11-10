import * as bare from "@bare-ts/lib"

export type u32 = number

export type UnsignedInt =
    | {
        readonly tag: 0
        readonly value: string
    }
    | {
        readonly tag: 1
        readonly value: u32
    }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return {
                tag: 0,
                value: bare.readString(bc),
            }
        case 1:
            return {
                tag: 1,
                value: bare.readU32(bc),
            }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void {
    switch (x.tag) {
        case 0: {
            bare.writeU8(bc, 0)
            {
                bare.writeString(bc, x.value)
            }
            break
        }
        case 1: {
            bare.writeU8(bc, 1)
            {
                bare.writeU32(bc, x.value)
            }
            break
        }
    }
}

export function encodeUnsignedInt(x: UnsignedInt, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeUnsignedInt(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeUnsignedInt(bytes: Uint8Array): UnsignedInt {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readUnsignedInt(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
