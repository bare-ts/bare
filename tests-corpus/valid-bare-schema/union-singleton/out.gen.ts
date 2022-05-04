import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number

export type U8 =
    | { readonly tag: 0; readonly val: u8 }

export function readU8(bc: bare.ByteCursor): U8 {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeU8(bc: bare.ByteCursor, x: U8): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}

export function encodeU8(x: U8): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeU8(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeU8(bytes: Uint8Array): U8 {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readU8(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
