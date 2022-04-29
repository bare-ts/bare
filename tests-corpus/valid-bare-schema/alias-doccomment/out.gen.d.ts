import * as bare from "@bare-ts/lib"

export type u8 = number

/**
 * First doctring
 */
export type U8Alias = u8

export function readU8Alias(bc: bare.ByteCursor): U8Alias

export function writeU8Alias(bc: bare.ByteCursor, x: U8Alias): void

/**
 * Second
 *
 * multiline
 * doctring
 */
export type U8Alias2 = u8

export function readU8Alias2(bc: bare.ByteCursor): U8Alias2

export function writeU8Alias2(bc: bare.ByteCursor, x: U8Alias2): void
