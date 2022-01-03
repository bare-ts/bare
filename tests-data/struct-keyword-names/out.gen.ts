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

export interface Operation {
    readonly type: string
    readonly struct: string
    readonly enum: string
    readonly const: boolean
    readonly bc: u8
}

export function decodeOperation(bc: bare.ByteCursor): Operation {
    const type = (bare.decodeString)(bc)
    const struct = (bare.decodeString)(bc)
    const _enum = (bare.decodeString)(bc)
    const _const = (bare.decodeBool)(bc)
    const _bc = (bare.decodeU8)(bc)
    return {
        type,
        struct,
        enum: _enum,
        const: _const,
        bc: _bc,
    }
}

export function encodeOperation(bc: bare.ByteCursor, x: Operation): void {
    (bare.encodeString)(bc, x.type);
    (bare.encodeString)(bc, x.struct);
    (bare.encodeString)(bc, x.enum);
    (bare.encodeBool)(bc, x.const);
    (bare.encodeU8)(bc, x.bc);
}
