import * as bare from "@bare-ts/lib"

export type u8 = number

export type Message = u8

export function readMessage(bc: bare.ByteCursor): Message {
    return bare.readU8(bc)
}

export function writeMessage(bc: bare.ByteCursor, x: Message): void {
    bare.writeU8(bc, x)
}

export function encodeMessage(x: Message, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMessage(bytes: Uint8Array): Message {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
