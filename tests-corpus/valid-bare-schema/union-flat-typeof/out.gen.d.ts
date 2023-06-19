import * as bare from "@bare-ts/lib"

export type u32 = number

export type TypeOfUnion =
    | boolean
    | u32
    | string
    | null

export function readTypeOfUnion(bc: bare.ByteCursor): TypeOfUnion

export function writeTypeOfUnion(bc: bare.ByteCursor, x: TypeOfUnion): void

export function encodeTypeOfUnion(x: TypeOfUnion, config?: Partial<bare.Config>): Uint8Array

export function decodeTypeOfUnion(bytes: Uint8Array): TypeOfUnion
