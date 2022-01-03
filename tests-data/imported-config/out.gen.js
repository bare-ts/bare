import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"


export const decodeMessage = bare.decodeU8

export const encodeMessage = bare.encodeU8

export function packMessage(x) {
    const bc = new bare.ByteCursor(
        new ArrayBuffer(ext.config.initialBufferLength),
        ext.config
    )
    encodeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function unpackMessage(bytes) {
    const bc = new bare.ByteCursor(bytes, ext.config)
    const result = decodeMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
