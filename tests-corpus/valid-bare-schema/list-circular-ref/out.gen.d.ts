import * as bare from "@bare-ts/lib"

export type Alias = readonly Alias[]

export function readAlias(bc: bare.ByteCursor): Alias

export function writeAlias(bc: bare.ByteCursor, x: Alias): void
