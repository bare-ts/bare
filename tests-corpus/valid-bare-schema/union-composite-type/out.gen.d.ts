import * as bare from "@bare-ts/lib"

export type Composite =
    | { readonly tag: 0; readonly val: ReadonlyMap<string, string | null> }
    | { readonly tag: 1; readonly val: readonly (string | null)[] }
    | { readonly tag: 2; readonly val: Uint8Array }

export function readComposite(bc: bare.ByteCursor): Composite

export function writeComposite(bc: bare.ByteCursor, x: Composite): void
