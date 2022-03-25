import * as bare from "@bare-ts/lib"

export type U8Array = Uint8Array

export function readU8Array(bc: bare.ByteCursor): U8Array {
    return bare.readU8Array(bc)
}

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    bare.writeU8Array(bc, x)
}
