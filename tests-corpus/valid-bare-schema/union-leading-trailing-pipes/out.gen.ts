import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number

export type LeadingPipe =
    | { readonly tag: 0, readonly val: u8 }

export function readLeadingPipe(bc: bare.ByteCursor): LeadingPipe {
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

export function writeLeadingPipe(bc: bare.ByteCursor, x: LeadingPipe): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}

export function encodeLeadingPipe(x: LeadingPipe): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeLeadingPipe(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeLeadingPipe(bytes: Uint8Array): LeadingPipe {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readLeadingPipe(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

export type TrailingPipe =
    | { readonly tag: 0, readonly val: u8 }

export function readTrailingPipe(bc: bare.ByteCursor): TrailingPipe {
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

export function writeTrailingPipe(bc: bare.ByteCursor, x: TrailingPipe): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}

export function encodeTrailingPipe(x: TrailingPipe): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeTrailingPipe(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeTrailingPipe(bytes: Uint8Array): TrailingPipe {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readTrailingPipe(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
