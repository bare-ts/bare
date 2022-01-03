import * as bare from "@bare-ts/lib"


export function decodeMaybeBool(bc) {
    return bare.decodeBool(bc)
        ? (bare.decodeBool)(bc)
        : undefined
}

export function encodeMaybeBool(bc, x) {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (bare.encodeBool)(bc, x)
    }
}
