import * as bare from "@bare-ts/lib"

export function readMaybeBool(bc) {
    return bare.readBool(bc)
        ? bare.readBool(bc)
        : undefined
}

export function writeMaybeBool(bc, x) {
    bare.writeBool(bc, x !== undefined)
    if (x !== undefined) {
        bare.writeBool(bc, x)
    }
}
