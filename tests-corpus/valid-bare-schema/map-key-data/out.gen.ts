import * as bare from "@bare-ts/lib"

export type Dict = ReadonlyMap<ArrayBuffer, string>

export function readDict(bc: bare.ByteCursor): Dict {
    const len = bare.readUintSafe(bc)
    const result = new Map<ArrayBuffer, string>()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = bare.readData(bc)
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
        bare.writeData(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}

export function encodeDict(x: Dict, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeDict(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeDict(bytes: Uint8Array): Dict {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readDict(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
