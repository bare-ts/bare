import * as bare from "@bare-ts/lib"

export type u8 = number

/**
 * First doctring
 */
export type U8Alias = u8

export function readU8Alias(bc: bare.ByteCursor): U8Alias

export function writeU8Alias(bc: bare.ByteCursor, x: U8Alias): void

export function encodeU8Alias(x: U8Alias, config?: Partial<bare.Config>): Uint8Array

export function decodeU8Alias(bytes: Uint8Array): U8Alias

/**
 * Second
 *
 * multiline
 * doctring
 */
export type U8Alias2 = u8

export function readU8Alias2(bc: bare.ByteCursor): U8Alias2

export function writeU8Alias2(bc: bare.ByteCursor, x: U8Alias2): void

export function encodeU8Alias2(x: U8Alias2, config?: Partial<bare.Config>): Uint8Array

export function decodeU8Alias2(bytes: Uint8Array): U8Alias2
