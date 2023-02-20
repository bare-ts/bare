import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

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
    for(const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeReadonlyMap(x: ReadonlyMap): Uint8Array {
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(config.initialBufferLength),
        config
    )
    writeReadonlyMap(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeReadonlyMap(bytes: Uint8Array): ReadonlyMap {
    const bc = new bare.ByteCursor(bytes, config)
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

export function encodeUint8Array(x: Uint8Array): Uint8Array {
    const bc = new bare.ByteCursor(
        new globalThis.Uint8Array(config.initialBufferLength),
        config
    )
    writeUint8Array(bc, x)
    return new globalThis.Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeUint8Array(bytes: Uint8Array): Uint8Array {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readUint8Array(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
