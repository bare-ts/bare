import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readTypeOfUnion(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return bare.readBool(bc)
        case 1:
            return bare.readU32(bc)
        case 2:
            return bare.readString(bc)
        case 3:
            return null
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeTypeOfUnion(bc, x) {
    switch (typeof x) {
        case "boolean": {
            bare.writeU8(bc, 0)
            bare.writeBool(bc, x)
            break
        }
        case "number": {
            bare.writeU8(bc, 1)
            bare.writeU32(bc, x)
            break
        }
        case "string": {
            bare.writeU8(bc, 2)
            bare.writeString(bc, x)
            break
        }
        default: {
            bare.writeU8(bc, 3)
            break
        }
    }
}

export function encodeTypeOfUnion(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeTypeOfUnion(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeTypeOfUnion(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readTypeOfUnion(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
