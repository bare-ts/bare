import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type Name = string

export function readName(bc: bare.ByteCursor): Name {
    return bare.readString(bc)
}

export function writeName(bc: bare.ByteCursor, x: Name): void {
    bare.writeString(bc, x)
}

export function encodeName(x: Name): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeName(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeName(bytes: Uint8Array): Name {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readName(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
