import * as bare from "@bare-ts/lib"

export type Map = globalThis.Map<string, string>

export function readMap(bc: bare.ByteCursor): Map

export function writeMap(bc: bare.ByteCursor, x: Map): void

export function encodeMap(x: Map): Uint8Array

export function decodeMap(bytes: Uint8Array): Map
