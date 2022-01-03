import * as _bare from "@bare-ts/lib"

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

export interface Person {
    readonly name: string
    readonly age: u8
}

export function decodePerson(bc: _bare.ByteCursor): Person

export function encodePerson(bc: _bare.ByteCursor, x: Person): void
