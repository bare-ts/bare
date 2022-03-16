import * as bare from "@bare-ts/lib"

export type MaybeBool = boolean | undefined | null

export function readMaybeBool(bc: bare.ByteCursor): MaybeBool {
    return bare.readBool(bc)
        ? bare.readBool(bc)
        : null
}

export function writeMaybeBool(bc: bare.ByteCursor, x: MaybeBool): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        bare.writeBool(bc, x)
    }
}
