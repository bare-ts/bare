import * as bare from "@bare-ts/lib"

export type u8 = number

/**
 * A struct to model persons
 */
export interface Person {
    /**
     * person's name
     */
    readonly name: string
    /**
     * person's age
     */
    readonly age: u8
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void

export function encodePerson(x: Person): Uint8Array

export function decodePerson(bytes: Uint8Array): Person
