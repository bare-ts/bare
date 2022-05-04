import * as bare from "@bare-ts/lib"

export type Data = ArrayBuffer

export function readData(bc: bare.ByteCursor): Data

export function writeData(bc: bare.ByteCursor, x: Data): void

export function encodeData(x: Data): Uint8Array

export function decodeData(bytes: Uint8Array): Data
