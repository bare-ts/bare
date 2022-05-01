import * as bare from "@bare-ts/lib"

export type u8 = number

export declare class Person {
    readonly name: string
    readonly age: u8
    constructor(
        name_: string,
        age_: u8,
    )
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
