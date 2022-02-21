import * as bare from "@bare-ts/lib"

export type u8 = number

export interface Person {
    readonly name: string
    readonly age: u8
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
