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

export type I64 = i64

export const readI64 = bare.readI64

export const writeI64 = bare.writeI64

export type U64 = u64

export const readU64 = bare.readU64

export const writeU64 = bare.writeU64
