import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type MaybeBool = boolean | null

export function readMaybeBool(bc: bare.ByteCursor): MaybeBool {
    return bare.readBool(bc)
        ? bare.readBool(bc)
        : null
}

export function writeMaybeBool(bc: bare.ByteCursor, x: MaybeBool): void {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        bare.writeBool(bc, x)
    }
}

export function encodeMaybeBool(x: MaybeBool): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeMaybeBool(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMaybeBool(bytes: Uint8Array): MaybeBool {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readMaybeBool(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
