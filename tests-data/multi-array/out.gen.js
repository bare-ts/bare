import * as bare from "@bare-ts/lib"


export function decodeMultiArray(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decode0
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeMultiArray(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (encode0)(bc, x[i])
    }
}

function decode0(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decode1
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode0(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (encode1)(bc, x[i])
    }
}

function decode1(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = bare.decodeString
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode1(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (bare.encodeString)(bc, x[i])
    }
}
