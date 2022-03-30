import * as bare from "@bare-ts/lib"

export interface Person {
    readonly name: string
    readonly gender: "FLUID" | "MALE" | "FEMALE"
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
