import * as bare from "@bare-ts/lib"

export function readAlias(bc) {
    return bare.readBool(bc) ? readAlias(bc) : null
}

export function writeAlias(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        writeAlias(bc, x)
    }
}
