import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

export type u8 = number

export type Message = u8

export function readMessage(bc: bare.ByteCursor): Message {
    return bare.readU8(bc)
}

export function writeMessage(bc: bare.ByteCursor, x: Message): void {
    bare.writeU8(bc, x)
}

export function encodeMessage(x: Message): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(ext.config.initialBufferLength),
        ext.config
    )
    writeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMessage(bytes: Uint8Array): Message {
    const bc = new bare.ByteCursor(bytes, ext.config)
    const result = readMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
