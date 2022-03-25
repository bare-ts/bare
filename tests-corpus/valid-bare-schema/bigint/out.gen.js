import * as bare from "@bare-ts/lib"

export function readI64(bc) {
    return bare.readI64(bc)
}

export function writeI64(bc, x) {
    bare.writeI64(bc, x)
}

export function readU64(bc) {
    return bare.readU64(bc)
}

export function writeU64(bc, x) {
    bare.writeU64(bc, x)
}
