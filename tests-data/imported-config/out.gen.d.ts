import * as bare from "@bare-ts/lib"

export type f32 = number
export type f64 = number
export type i8 = number
export type i16 = number
export type i32 = number
export type i64 = bigint
export type i64Safe = number
export type int = bigint
export type intSafe = number
export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint
export type u64Safe = number
export type uint = bigint
export type uintSafe = number

export type Message = u8

export function decodeMessage(bc: bare.ByteCursor): Message

export function encodeMessage(bc: bare.ByteCursor, x: Message): void

export function packMessage(x: Message): Uint8Array

export function unpackMessage(bytes: ArrayBuffer | Uint8Array): Message
