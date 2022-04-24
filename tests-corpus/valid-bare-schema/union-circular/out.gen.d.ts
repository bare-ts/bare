import * as bare from "@bare-ts/lib"

export type u8 = number

export type Alias =
    | { readonly tag: 0; readonly val: Alias1 }
    | { readonly tag: 1; readonly val: Alias2 }

export function readAlias(bc: bare.ByteCursor): Alias

export function writeAlias(bc: bare.ByteCursor, x: Alias): void

export type Alias1 = Alias

export function readAlias1(bc: bare.ByteCursor): Alias1

export function writeAlias1(bc: bare.ByteCursor, x: Alias1): void

export type Alias2 = u8

export function readAlias2(bc: bare.ByteCursor): Alias2

export function writeAlias2(bc: bare.ByteCursor, x: Alias2): void
