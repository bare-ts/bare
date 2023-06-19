import * as bare from "@bare-ts/lib"

export type ReadonlyMap = globalThis.ReadonlyMap<string, string>

export function readReadonlyMap(bc: bare.ByteCursor): ReadonlyMap

export function writeReadonlyMap(bc: bare.ByteCursor, x: ReadonlyMap): void

export function encodeReadonlyMap(x: ReadonlyMap, config?: Partial<bare.Config>): Uint8Array

export function decodeReadonlyMap(bytes: Uint8Array): ReadonlyMap

export type Uint8Array = globalThis.Uint8Array

export function readUint8Array(bc: bare.ByteCursor): Uint8Array

export function writeUint8Array(bc: bare.ByteCursor, x: Uint8Array): void

export function encodeUint8Array(x: Uint8Array, config?: Partial<bare.Config>): Uint8Array

export function decodeUint8Array(bytes: Uint8Array): Uint8Array
