import * as bare from "@bare-ts/lib"

export type MaybeBool = boolean | null | undefined

export function readMaybeBool(bc: bare.ByteCursor): MaybeBool

export function writeMaybeBool(bc: bare.ByteCursor, x: MaybeBool): void

export function encodeMaybeBool(x: MaybeBool): Uint8Array

export function decodeMaybeBool(bytes: Uint8Array): MaybeBool
