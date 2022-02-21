import * as bare from "@bare-ts/lib"

export type u32 = number

export type TypeOfUnion = 
    | boolean
    | u32
    | string
    | undefined

export function readTypeOfUnion(bc: bare.ByteCursor): TypeOfUnion

export function writeTypeOfUnion(bc: bare.ByteCursor, x: TypeOfUnion): void
