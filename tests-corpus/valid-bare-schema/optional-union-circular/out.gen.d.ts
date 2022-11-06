import * as bare from "@bare-ts/lib"

export type Alias =
    | { readonly tag: 0, readonly val: Alias }
    | { readonly tag: 1, readonly val: string } | null

export function readAlias(bc: bare.ByteCursor): Alias

export function writeAlias(bc: bare.ByteCursor, x: Alias): void
