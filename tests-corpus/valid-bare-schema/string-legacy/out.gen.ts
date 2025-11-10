import * as bare from "@bare-ts/lib"

export type Name = string

export function readName(bc: bare.ByteCursor): Name {
    return bare.readString(bc)
}

export function writeName(bc: bare.ByteCursor, x: Name): void {
    bare.writeString(bc, x)
}

export function encodeName(x: Name, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeName(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeName(bytes: Uint8Array): Name {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readName(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
