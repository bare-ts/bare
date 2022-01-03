import * as bare from "@bare-ts/lib"


export function decodeU8Alias(bc) {
    return bare.decodeFixedData(bc, 4)
}

export function encodeU8Alias(bc, x) {
    bare.encodeFixedData(bc, x, 4)
}
