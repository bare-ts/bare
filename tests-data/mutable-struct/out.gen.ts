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

export interface Person {
    name: string
    age: u8
}

export function decodePerson(bc: bare.ByteCursor): Person {
    const name = (bare.decodeString)(bc)
    const age = (bare.decodeU8)(bc)
    return {
        name,
        age,
    }
}

export function encodePerson(bc: bare.ByteCursor, x: Person): void {
    (bare.encodeString)(bc, x.name);
    (bare.encodeU8)(bc, x.age);
}
