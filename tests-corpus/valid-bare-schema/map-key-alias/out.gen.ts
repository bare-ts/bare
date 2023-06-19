import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export type KeyType = string

export function readKeyType(bc: bare.ByteCursor): KeyType {
    return bare.readString(bc)
}

export function writeKeyType(bc: bare.ByteCursor, x: KeyType): void {
    bare.writeString(bc, x)
}

export type Dict = ReadonlyMap<KeyType, string>

export function readDict(bc: bare.ByteCursor): Dict {
    const len = bare.readUintSafe(bc)
    const result = new Map<KeyType, string>()
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

export function writeDict(bc: bare.ByteCursor, x: Dict): void {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        writeKeyType(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeDict(x: Dict, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeDict(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeDict(bytes: Uint8Array): Dict {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readDict(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
