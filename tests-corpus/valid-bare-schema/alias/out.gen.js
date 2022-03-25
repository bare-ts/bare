import * as bare from "@bare-ts/lib"

export function readU8Alias(bc) {
    return bare.readU8(bc)
}

export function writeU8Alias(bc, x) {
    bare.writeU8(bc, x)
}
