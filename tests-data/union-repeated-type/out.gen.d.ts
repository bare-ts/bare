import * as bare from "@bare-ts/lib"

export type u8 = number

export type X = 
    | { readonly tag: 0; readonly val: u8 }
    | { readonly tag: 1; readonly val: u8 }

export function readX(bc: bare.ByteCursor): X

export function writeX(bc: bare.ByteCursor, x: X): void
