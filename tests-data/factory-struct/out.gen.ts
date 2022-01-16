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

export type Person = ReturnType<typeof ext.Person>

export function readPerson(bc: bare.ByteCursor): Person {
    const name = (bare.readString)(bc)
    const age = (bare.readU8)(bc)
    return ext.Person(name,age)
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    (bare.writeString)(bc, x.name);
    (bare.writeU8)(bc, x.age);
}
