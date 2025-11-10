import * as bare from "@bare-ts/lib"

export type u8 = number

export type ReadonlyMap = globalThis.ReadonlyMap<string, string>

export function readReadonlyMap(bc: bare.ByteCursor): ReadonlyMap {
    const len = bare.readUintSafe(bc)
    const result = new Map<string, string>()
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

export function writeReadonlyMap(bc: bare.ByteCursor, x: ReadonlyMap): void {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeReadonlyMap(x: ReadonlyMap, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeReadonlyMap(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeReadonlyMap(bytes: globalThis.Uint8Array): ReadonlyMap {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readReadonlyMap(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export type Uint8Array = globalThis.Uint8Array

export function readUint8Array(bc: bare.ByteCursor): Uint8Array {
    return bare.readU8Array(bc)
}

export function writeUint8Array(bc: bare.ByteCursor, x: Uint8Array): void {
    bare.writeU8Array(bc, x)
}

export function encodeUint8Array(x: Uint8Array, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeUint8Array(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeUint8Array(bytes: globalThis.Uint8Array): Uint8Array {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readUint8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export type ArrayBuffer = globalThis.ArrayBuffer

export function readArrayBuffer(bc: bare.ByteCursor): ArrayBuffer {
    return bare.readData(bc)
}

export function writeArrayBuffer(bc: bare.ByteCursor, x: ArrayBuffer): void {
    bare.writeData(bc, x)
}

export function encodeArrayBuffer(x: ArrayBuffer, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeArrayBuffer(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeArrayBuffer(bytes: globalThis.Uint8Array): ArrayBuffer {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readArrayBuffer(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export type Partial = u8 | null

export function readPartial(bc: bare.ByteCursor): Partial {
    return bare.readBool(bc) ? bare.readU8(bc) : null
}

export function writePartial(bc: bare.ByteCursor, x: Partial): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        bare.writeU8(bc, x)
    }
}

export function encodePartial(x: Partial, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writePartial(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePartial(bytes: globalThis.Uint8Array): Partial {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readPartial(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
