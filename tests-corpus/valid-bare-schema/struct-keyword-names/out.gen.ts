import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number

export interface Operation {
    readonly type: string
    readonly struct: string
    readonly enum: string
    readonly const: boolean
    readonly bc: u8
}

export function readOperation(bc: bare.ByteCursor): Operation {
    return {
        type: bare.readString(bc),
        struct: bare.readString(bc),
        enum: bare.readString(bc),
        const: bare.readBool(bc),
        bc: bare.readU8(bc),
    }
}

export function writeOperation(bc: bare.ByteCursor, x: Operation): void {
    bare.writeString(bc, x.type)
    bare.writeString(bc, x.struct)
    bare.writeString(bc, x.enum)
    bare.writeBool(bc, x.const)
    bare.writeU8(bc, x.bc)
}

export function encodeOperation(x: Operation): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeOperation(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeOperation(bytes: Uint8Array): Operation {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readOperation(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
