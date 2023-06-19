import * as bare from "@bare-ts/lib"

export type KeyType = string

export function readKeyType(bc: bare.ByteCursor): KeyType

export function writeKeyType(bc: bare.ByteCursor, x: KeyType): void

export type Dict = ReadonlyMap<KeyType, string>

export function readDict(bc: bare.ByteCursor): Dict

export function writeDict(bc: bare.ByteCursor, x: Dict): void

export function encodeDict(x: Dict, config?: Partial<bare.Config>): Uint8Array

export function decodeDict(bytes: Uint8Array): Dict
