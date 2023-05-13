import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readKeyType(bc) {
    return bare.readString(bc)
}

export function writeKeyType(bc, x) {
    bare.writeString(bc, x)
}

export function readDict(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = readKeyType(bc)
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
        writeKeyType(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeDict(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeDict(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeDict(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readDict(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
