import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type Data = ArrayBuffer

export function readData(bc: bare.ByteCursor): Data {
    return bare.readData(bc)
}

export function writeData(bc: bare.ByteCursor, x: Data): void {
    bare.writeData(bc, x)
}

export function encodeData(x: Data): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeData(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeData(bytes: Uint8Array): Data {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readData(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
