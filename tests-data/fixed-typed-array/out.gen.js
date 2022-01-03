import assert from "assert"
import * as bare from "@bare-ts/lib"


export function decodeU8Array(bc) {
    const len = 4
    const valDecoder = bare.decodeU8
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeU8Array(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 1; i < x.length; i++) {
        (bare.encodeU8)(bc, x[i])
    }
}
