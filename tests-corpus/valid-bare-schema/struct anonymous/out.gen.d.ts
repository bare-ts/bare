import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number

export interface Person {
    readonly name: string
    readonly age: u8
    readonly address: {
        readonly country: string
        readonly city: {
            readonly name: string
            readonly code: u16
        }
        readonly street: string
    }
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
