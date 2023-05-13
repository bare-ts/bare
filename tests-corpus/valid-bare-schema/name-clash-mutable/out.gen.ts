import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type Map = globalThis.Map<string, string>

export function readMap(bc: bare.ByteCursor): Map {
    const len = bare.readUintSafe(bc)
    const result = new globalThis.Map<string, string>()
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

export function writeMap(bc: bare.ByteCursor, x: Map): void {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeMap(x: Map): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeMap(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMap(bytes: Uint8Array): Map {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readMap(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
