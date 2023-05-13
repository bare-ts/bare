import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readBoxedU32(bc) {
    return {
        "val": bare.readU32(bc),
    }
}

export function writeBoxedU32(bc, x) {
    bare.writeU32(bc, x["val"])
}

export function readBoxedStr(bc) {
    return {
        "val": bare.readString(bc),
    }
}

export function writeBoxedStr(bc, x) {
    bare.writeString(bc, x["val"])
}

export function readBoxed(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { "tag": tag, "val": readBoxedU32(bc) }
        case 1:
            return { "tag": tag, "val": readBoxedStr(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeBoxed(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x["tag"]) {
        case 0: {
            writeBoxedU32(bc, x["val"])
            break
        }
        case 1: {
            writeBoxedStr(bc, x["val"])
            break
        }
    }
}

export function encodeBoxed(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeBoxed(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeBoxed(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readBoxed(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
