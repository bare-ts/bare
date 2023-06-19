import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readOperation(bc) {
    return {
        type: bare.readString(bc),
        struct: bare.readString(bc),
        enum: bare.readString(bc),
        const: bare.readBool(bc),
        bc: bare.readU8(bc),
    }
}

export function writeOperation(bc, x) {
    bare.writeString(bc, x.type)
    bare.writeString(bc, x.struct)
    bare.writeString(bc, x.enum)
    bare.writeBool(bc, x.const)
    bare.writeU8(bc, x.bc)
}

export function encodeOperation(x, config = DEFAULT_CONFIG) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeOperation(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeOperation(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readOperation(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
