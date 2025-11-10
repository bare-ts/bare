import * as bare from "@bare-ts/lib"

export function readU8(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeU8(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0: {
            bare.writeU8(bc, x.val)
            break
        }
    }
}

export function encodeU8(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeU8(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readU8(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
