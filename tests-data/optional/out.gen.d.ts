import * as bare from "@bare-ts/lib"

export type MaybeBool = boolean | undefined

export function readMaybeBool(bc: bare.ByteCursor): MaybeBool

export function writeMaybeBool(bc: bare.ByteCursor, x: MaybeBool): void
