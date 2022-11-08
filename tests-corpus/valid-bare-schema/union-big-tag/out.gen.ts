import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint

export type UnsignedInt =
    | { readonly tag: 0, readonly val: u8 }
    | { readonly tag: 1, readonly val: u16 }
    | { readonly tag: 2, readonly val: u32 }
    | { readonly tag: 9007199254740991, readonly val: u64 }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.readUintSafe(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        case 1:
            return { tag, val: bare.readU16(bc) }
        case 2:
            return { tag, val: bare.readU32(bc) }
        case 9007199254740991:
            return { tag, val: bare.readU64(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void {
    bare.writeUintSafe(bc, x.tag)
    switch (x.tag) {
        case 0: {
            bare.writeU8(bc, x.val)
            break
        }
        case 1: {
            bare.writeU16(bc, x.val)
            break
        }
        case 2: {
            bare.writeU32(bc, x.val)
            break
        }
        case 9007199254740991: {
            bare.writeU64(bc, x.val)
            break
        }
    }
}

export function encodeUnsignedInt(x: UnsignedInt): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeUnsignedInt(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeUnsignedInt(bytes: Uint8Array): UnsignedInt {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readUnsignedInt(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
