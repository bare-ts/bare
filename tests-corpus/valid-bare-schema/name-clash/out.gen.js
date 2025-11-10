import * as bare from "@bare-ts/lib"

export function readReadonlyMap(bc) {
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

export function writeReadonlyMap(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeReadonlyMap(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeReadonlyMap(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeReadonlyMap(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readReadonlyMap(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export function readUint8Array(bc) {
    return bare.readU8Array(bc)
}

export function writeUint8Array(bc, x) {
    bare.writeU8Array(bc, x)
}

export function encodeUint8Array(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeUint8Array(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeUint8Array(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readUint8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export function readArrayBuffer(bc) {
    return bare.readData(bc)
}

export function writeArrayBuffer(bc, x) {
    bare.writeData(bc, x)
}

export function encodeArrayBuffer(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeArrayBuffer(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeArrayBuffer(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readArrayBuffer(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export function readPartial(bc) {
    return bare.readBool(bc) ? bare.readU8(bc) : null
}

export function writePartial(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        bare.writeU8(bc, x)
    }
}

export function encodePartial(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writePartial(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePartial(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readPartial(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
