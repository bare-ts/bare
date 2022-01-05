import * as bare from "@bare-ts/lib"


export function decodeU8Array(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = bare.decodeU8
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeU8Array(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.encodeU8)(bc, x[i])
    }
}
