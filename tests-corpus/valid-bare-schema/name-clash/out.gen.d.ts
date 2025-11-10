import * as bare from "@bare-ts/lib"

export type u8 = number

export type ReadonlyMap = globalThis.ReadonlyMap<string, string>

export function readReadonlyMap(bc: bare.ByteCursor): ReadonlyMap

export function writeReadonlyMap(bc: bare.ByteCursor, x: ReadonlyMap): void

export function encodeReadonlyMap(x: ReadonlyMap, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array

export function decodeReadonlyMap(bytes: globalThis.Uint8Array): ReadonlyMap

export type Uint8Array = globalThis.Uint8Array

export function readUint8Array(bc: bare.ByteCursor): Uint8Array

export function writeUint8Array(bc: bare.ByteCursor, x: Uint8Array): void

export function encodeUint8Array(x: Uint8Array, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array

export function decodeUint8Array(bytes: globalThis.Uint8Array): Uint8Array

export type ArrayBuffer = globalThis.ArrayBuffer

export function readArrayBuffer(bc: bare.ByteCursor): ArrayBuffer

export function writeArrayBuffer(bc: bare.ByteCursor, x: ArrayBuffer): void

export function encodeArrayBuffer(x: ArrayBuffer, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array

export function decodeArrayBuffer(bytes: globalThis.Uint8Array): ArrayBuffer

export type Partial = u8 | null

export function readPartial(bc: bare.ByteCursor): Partial

export function writePartial(bc: bare.ByteCursor, x: Partial): void

export function encodePartial(x: Partial, config?: globalThis.Partial<bare.Config>): globalThis.Uint8Array

export function decodePartial(bytes: globalThis.Uint8Array): Partial
