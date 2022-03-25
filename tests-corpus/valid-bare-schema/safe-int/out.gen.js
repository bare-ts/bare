import * as bare from "@bare-ts/lib"

export function readI64(bc) {
    return bare.readI64Safe(bc)
}

export function writeI64(bc, x) {
    bare.writeI64Safe(bc, x)
}

export function readU64(bc) {
    return bare.readU64Safe(bc)
}

export function writeU64(bc, x) {
    bare.writeU64Safe(bc, x)
}
