import assert from "assert"
import * as bare from "@bare-ts/lib"


export function decodeComposite(bc) {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0: {
            const val = (decode0)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (decode1)(bc)
            return { tag, val }
        }
        case 2: {
            const val = (decode2)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeComposite(bc, x) {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (encode0)(bc, x.val)
            break
        case 1:
            (encode1)(bc, x.val)
            break
        case 2:
            (encode2)(bc, x.val)
            break
    }
}

function decode0(bc) {
    const len = bare.decodeUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.decodeString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (decode3)(bc))
    }
    return result
}

function encode0(bc, x) {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (encode3)(bc, kv[1])
    }
}

function decode1(bc) {
    const len = 4
    const valDecoder = decode4
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode1(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        (encode4)(bc, x[i])
    }
}

function decode2(bc) {
    return bare.decodeU8FixedArray(bc, 4)
}

function encode2(bc, x) {
    return bare.encodeU8FixedArray(bc, x, 4)
}

function decode3(bc) {
    return bare.decodeBool(bc)
        ? (bare.decodeString)(bc)
        : undefined
}

function encode3(bc, x) {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (bare.encodeString)(bc, x)
    }
}

function decode4(bc) {
    return bare.decodeBool(bc)
        ? (bare.decodeString)(bc)
        : undefined
}

function encode4(bc, x) {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (bare.encodeString)(bc, x)
    }
}
