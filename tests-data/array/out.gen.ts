import * as bare from "@bare-ts/lib"

export type u8 = number

export type U8Array = readonly (u8)[]

export function readU8Array(bc: bare.ByteCursor): U8Array {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = bare.readU8
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeU8Array(bc: bare.ByteCursor, x: U8Array): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.writeU8)(bc, x[i])
    }
}
