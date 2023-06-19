import * as bare from "@bare-ts/lib"

export type Name = string

export function readName(bc: bare.ByteCursor): Name

export function writeName(bc: bare.ByteCursor, x: Name): void

export function encodeName(x: Name, config?: Partial<bare.Config>): Uint8Array

export function decodeName(bytes: Uint8Array): Name
