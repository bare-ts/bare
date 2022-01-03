import * as bare from "@bare-ts/lib"


export function decodeU64Array(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = bare.decodeU64Safe
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeU64Array(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (bare.encodeU64Safe)(bc, x[i])
    }
}
