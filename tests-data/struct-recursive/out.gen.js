import * as bare from "@bare-ts/lib"


export function decodeNode(bc) {
    const children = (decode0)(bc)
    return {
        children,
    }
}

export function encodeNode(bc, x) {
    (encode0)(bc, x.children);
}

function decode0(bc) {
    return bare.decodeBool(bc)
        ? (decode1)(bc)
        : undefined
}

function encode0(bc, x) {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (encode1)(bc, x)
    }
}

function decode1(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decodeNode
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode1(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (encodeNode)(bc, x[i])
    }
}
