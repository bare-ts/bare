import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export class BoxedU32 {
    constructor(
        val_,
    ) {
        this.val = val_
    }
}

export function readBoxedU32(bc) {
    return new BoxedU32(
        bare.readU32(bc),
    )
}

export function writeBoxedU32(bc, x) {
    bare.writeU32(bc, x.val)
}

export class BoxedStr {
    constructor(
        val_,
    ) {
        this.val = val_
    }
}

export function readBoxedStr(bc) {
    return new BoxedStr(
        bare.readString(bc),
    )
}

export function writeBoxedStr(bc, x) {
    bare.writeString(bc, x.val)
}

export function readBoxedTransStr(bc) {
    return readBoxedStr(bc)
}

export function writeBoxedTransStr(bc, x) {
    writeBoxedStr(bc, x)
}

export function readBoxed(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag: "BoxedU32", val: readBoxedU32(bc) }
        case 1:
            return { tag: "BoxedTransStr", val: readBoxedTransStr(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeBoxed(bc, x) {
    switch (x.tag) {
        case "BoxedU32": {
            bare.writeU8(bc, 0)
            writeBoxedU32(bc, x.val)
            break
        }
        case "BoxedTransStr": {
            bare.writeU8(bc, 1)
            writeBoxedTransStr(bc, x.val)
            break
        }
    }
}

export function encodeBoxed(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeBoxed(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeBoxed(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readBoxed(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
