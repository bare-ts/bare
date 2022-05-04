import assert from "assert"
import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export function readComposite(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: read0(bc) }
        case 1:
            return { tag, val: read1(bc) }
        case 2:
            return { tag, val: bare.readU8FixedArray(bc, 4) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeComposite(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            write0(bc, x.val)
            break
        case 1:
            write1(bc, x.val)
            break
        case 2:
            {
                assert(x.val.length === 4)
                bare.writeU8FixedArray(bc, x.val)
            }
            break
    }
}

export function encodeComposite(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeComposite(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeComposite(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readComposite(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

function read0(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = bare.readString(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, read2(bc))
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        bare.writeString(bc, kv[0])
        write2(bc, kv[1])
    }
}

function read1(bc) {
    const len = 4
    const result = [read2(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read2(bc)
    }
    return result
}

function write1(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        write2(bc, x[i])
    }
}

function read2(bc) {
    return bare.readBool(bc)
        ? bare.readString(bc)
        : null
}

function write2(bc, x) {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        bare.writeString(bc, x)
    }
}
