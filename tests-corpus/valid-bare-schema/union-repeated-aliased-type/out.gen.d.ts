import * as bare from "@bare-ts/lib"

export type u8 = number

export type Y = u8

export function readY(bc: bare.ByteCursor): Y

export function writeY(bc: bare.ByteCursor, x: Y): void

export type X =
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: "Y"; readonly val: Y }

export function readX(bc: bare.ByteCursor): X

export function writeX(bc: bare.ByteCursor, x: X): void

export function encodeX(x: X, config?: Partial<bare.Config>): Uint8Array

export function decodeX(bytes: Uint8Array): X
