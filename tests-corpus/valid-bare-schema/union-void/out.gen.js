import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readUnsignedInt(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        case 1:
            return { tag, val: bare.readU16(bc) }
        case 2:
            return { tag, val: bare.readU32(bc) }
        case 3:
            return { tag, val: bare.readU64(bc) }
        case 4:
            return { tag, val: null }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc, x) {
    bare.writeU8(bc, x.tag)
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
        case 3: {
            bare.writeU64(bc, x.val)
            break
        }
    }
}

export function encodeUnsignedInt(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeUnsignedInt(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeUnsignedInt(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readUnsignedInt(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
