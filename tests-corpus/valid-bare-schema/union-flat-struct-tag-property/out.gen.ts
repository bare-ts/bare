import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u32 = number

export type BoxedU32 = {
    readonly tag: string
    readonly val: u32
}

export function readBoxedU32(bc: bare.ByteCursor): BoxedU32 {
    return {
        tag: bare.readString(bc),
        val: bare.readU32(bc),
    }
}

export function writeBoxedU32(bc: bare.ByteCursor, x: BoxedU32): void {
    bare.writeString(bc, x.tag)
    bare.writeU32(bc, x.val)
}

export type BoxedStr = {
    readonly val: string
}

export function readBoxedStr(bc: bare.ByteCursor): BoxedStr {
    return {
        val: bare.readString(bc),
    }
}

export function writeBoxedStr(bc: bare.ByteCursor, x: BoxedStr): void {
    bare.writeString(bc, x.val)
}

export type Boxed =
    | { readonly tag: "BoxedU32"; readonly val: BoxedU32 }
    | { readonly tag: "BoxedStr"; readonly val: BoxedStr }

export function readBoxed(bc: bare.ByteCursor): Boxed {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag: "BoxedU32", val: readBoxedU32(bc) }
        case 1:
            return { tag: "BoxedStr", val: readBoxedStr(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeBoxed(bc: bare.ByteCursor, x: Boxed): void {
    switch (x.tag) {
        case "BoxedU32": {
            bare.writeU8(bc, 0)
            writeBoxedU32(bc, x.val)
            break
        }
        case "BoxedStr": {
            bare.writeU8(bc, 1)
            writeBoxedStr(bc, x.val)
            break
        }
    }
}

export function encodeBoxed(x: Boxed): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writeBoxed(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeBoxed(bytes: Uint8Array): Boxed {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readBoxed(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
