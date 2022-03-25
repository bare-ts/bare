import * as bare from "@bare-ts/lib"

export function readU8Array(bc) {
    return bare.readU8Array(bc)
}

export function writeU8Array(bc, x) {
    bare.writeU8Array(bc, x)
}
