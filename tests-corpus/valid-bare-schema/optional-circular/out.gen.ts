import * as bare from "@bare-ts/lib"

export type Alias = null

export function readAlias(bc: bare.ByteCursor): Alias {
    return bare.readBool(bc) ? readAlias(bc) : null
}

export function writeAlias(bc: bare.ByteCursor, x: Alias): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        writeAlias(bc, x)
    }
}
