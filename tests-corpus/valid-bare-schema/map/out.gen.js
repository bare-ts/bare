import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readDict(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = bare.readString(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, bare.readString(bc))
    }
    return result
}

export function writeDict(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeDict(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeDict(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeDict(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readDict(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
