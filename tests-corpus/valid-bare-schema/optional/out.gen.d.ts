import * as bare from "@bare-ts/lib"

export type MaybeBool = boolean | null

export function readMaybeBool(bc: bare.ByteCursor): MaybeBool

export function writeMaybeBool(bc: bare.ByteCursor, x: MaybeBool): void

export function encodeMaybeBool(x: MaybeBool, config?: Partial<bare.Config>): Uint8Array

export function decodeMaybeBool(bytes: Uint8Array): MaybeBool
