import * as bare from "@bare-ts/lib"

export type i64Safe = number
export type u64Safe = number

export type I64 = i64Safe

export function readI64(bc: bare.ByteCursor): I64 {
    return bare.readI64Safe(bc)
}

export function writeI64(bc: bare.ByteCursor, x: I64): void {
    bare.writeI64Safe(bc, x)
}

export function encodeI64(x: I64, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeI64(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeI64(bytes: Uint8Array): I64 {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readI64(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export type U64 = u64Safe

export function readU64(bc: bare.ByteCursor): U64 {
    return bare.readU64Safe(bc)
}

export function writeU64(bc: bare.ByteCursor, x: U64): void {
    bare.writeU64Safe(bc, x)
}

export function encodeU64(x: U64, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeU64(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU64(bytes: Uint8Array): U64 {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readU64(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
