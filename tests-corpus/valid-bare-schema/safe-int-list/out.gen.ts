import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type U64List = BigUint64Array

export function readU64List(bc: bare.ByteCursor): U64List {
    return bare.readU64Array(bc)
}

export function writeU64List(bc: bare.ByteCursor, x: U64List): void {
    bare.writeU64Array(bc, x)
}

export function encodeU64List(x: U64List): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU64List(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU64List(bytes: Uint8Array): U64List {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU64List(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
