import * as bare from "@bare-ts/lib"

export type u8 = number

export type U8List = readonly u8[]

export function readU8List(bc: bare.ByteCursor): U8List {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readU8(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU8(bc)
    }
    return result
}

export function writeU8List(bc: bare.ByteCursor, x: U8List): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeU8(bc, x[i])
    }
}
