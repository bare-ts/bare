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

export function readOperation(bc: bare.ByteCursor): Operation {
    const type = (bare.readString)(bc)
    const struct = (bare.readString)(bc)
    const _enum = (bare.readString)(bc)
    const _const = (bare.readBool)(bc)
    const _bc = (bare.readU8)(bc)
    return {
        type,
        struct,
        enum: _enum,
        const: _const,
        bc: _bc,
    }
}

export function writeOperation(bc: bare.ByteCursor, x: Operation): void {
    (bare.writeString)(bc, x.type);
    (bare.writeString)(bc, x.struct);
    (bare.writeString)(bc, x.enum);
    (bare.writeBool)(bc, x.const);
    (bare.writeU8)(bc, x.bc);
}
