import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

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

export const decodeMessage = bare.decodeU8

export const encodeMessage = bare.encodeU8

export function packMessage(x: Message): Uint8Array {
    const bc = new bare.ByteCursor(
        new ArrayBuffer(ext.config.initialBufferLength),
        ext.config
    )
    encodeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function unpackMessage(bytes: ArrayBuffer | Uint8Array): Message {
    const bc = new bare.ByteCursor(bytes, ext.config)
    const result = decodeMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
