import * as bare from "@bare-ts/lib"

export type Alias = readonly (
    | { readonly tag: "Alias"; readonly val: Alias }
    | { readonly tag: 1; readonly val: string })[]

export function readAlias(bc: bare.ByteCursor): Alias

export function writeAlias(bc: bare.ByteCursor, x: Alias): void
