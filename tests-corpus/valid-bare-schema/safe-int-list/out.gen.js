import * as bare from "@bare-ts/lib"

export function readU64List(bc) {
    return bare.readU64Array(bc)
}

export function writeU64List(bc, x) {
    bare.writeU64Array(bc, x)
}
