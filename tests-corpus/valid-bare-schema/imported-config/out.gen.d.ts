import * as bare from "@bare-ts/lib"

export type u8 = number

export type Message = u8

export function readMessage(bc: bare.ByteCursor): Message

export function writeMessage(bc: bare.ByteCursor, x: Message): void

export function encodeMessage(x: Message, config?: Partial<bare.Config>): Uint8Array

export function decodeMessage(bytes: Uint8Array): Message
