import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number

/**
 * First doctring
 */
export type U8Alias = u8

export function readU8Alias(bc: bare.ByteCursor): U8Alias {
    return bare.readU8(bc)
}

export function writeU8Alias(bc: bare.ByteCursor, x: U8Alias): void {
    bare.writeU8(bc, x)
}

export function encodeU8Alias(x: U8Alias): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU8Alias(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Alias(bytes: Uint8Array): U8Alias {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8Alias(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

/**
 * Second
 *
 * multiline
 * doctring
 */
export type U8Alias2 = u8

export function readU8Alias2(bc: bare.ByteCursor): U8Alias2 {
    return bare.readU8(bc)
}

export function writeU8Alias2(bc: bare.ByteCursor, x: U8Alias2): void {
    bare.writeU8(bc, x)
}

export function encodeU8Alias2(x: U8Alias2): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU8Alias2(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8Alias2(bytes: Uint8Array): U8Alias2 {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8Alias2(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
