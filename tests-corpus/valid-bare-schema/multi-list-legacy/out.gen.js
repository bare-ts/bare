import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

function read0(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [bare.readString(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readString(bc)
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeString(bc, x[i])
    }
}

function read1(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [read0(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read0(bc)
    }
    return result
}

function write1(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        write0(bc, x[i])
    }
}

export function readMultiList(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [read1(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read1(bc)
    }
    return result
}

export function writeMultiList(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        write1(bc, x[i])
    }
}

export function encodeMultiList(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeMultiList(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMultiList(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readMultiList(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
