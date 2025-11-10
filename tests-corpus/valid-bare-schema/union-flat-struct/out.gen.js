import * as bare from "@bare-ts/lib"

export function readBoxedU32(bc) {
    return {
        tag: "BoxedU32",
        val: bare.readU32(bc),
    }
}

export function writeBoxedU32(bc, x) {
    bare.writeU32(bc, x.val)
}

export function readBoxedStr(bc) {
    return {
        tag: "BoxedStr",
        val: bare.readString(bc),
    }
}

export function writeBoxedStr(bc, x) {
    bare.writeString(bc, x.val)
}

export function readBoxed(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return readBoxedU32(bc)
        case 1:
            return readBoxedStr(bc)
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeBoxed(bc, x) {
    switch (x.tag) {
        case "BoxedU32": {
            bare.writeU8(bc, 0)
            writeBoxedU32(bc, x)
            break
        }
        case "BoxedStr": {
            bare.writeU8(bc, 1)
            writeBoxedStr(bc, x)
            break
        }
    }
}

export function encodeBoxed(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeBoxed(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeBoxed(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readBoxed(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
