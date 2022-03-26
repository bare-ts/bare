import * as bare from "@bare-ts/lib"

export type u64Safe = number

export type U64List = readonly u64Safe[]

export function readU64List(bc: bare.ByteCursor): U64List {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readU64Safe(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU64Safe(bc)
    }
    return result
}

export function writeU64List(bc: bare.ByteCursor, x: U64List): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeU64Safe(bc, x[i])
    }
}
