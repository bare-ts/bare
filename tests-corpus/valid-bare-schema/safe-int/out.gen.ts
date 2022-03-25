import * as bare from "@bare-ts/lib"

export type i64Safe = number
export type u64Safe = number

export type I64 = i64Safe

export function readI64(bc: bare.ByteCursor): I64 {
    return bare.readI64Safe(bc)
}

export function writeI64(bc: bare.ByteCursor, x: I64): void {
    bare.writeI64Safe(bc, x)
}

export type U64 = u64Safe

export function readU64(bc: bare.ByteCursor): U64 {
    return bare.readU64Safe(bc)
}

export function writeU64(bc: bare.ByteCursor, x: U64): void {
    bare.writeU64Safe(bc, x)
}
