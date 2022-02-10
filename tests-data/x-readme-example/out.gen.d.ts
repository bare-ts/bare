import * as bare from "@bare-ts/lib"

export declare enum Gender {
    FEMALE = "FEMALE",
    FLUID = "FLUID",
    MALE = "MALE",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export interface Person {
    readonly name: string
    readonly email: string
    readonly gender: Gender | undefined
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void

export interface Organization {
    readonly name: string
    readonly email: string
}

export function readOrganization(bc: bare.ByteCursor): Organization

export function writeOrganization(bc: bare.ByteCursor, x: Organization): void

export type Contact = 
    | { readonly tag: 0; readonly val: Person }
    | { readonly tag: 1; readonly val: Organization }

export function readContact(bc: bare.ByteCursor): Contact

export function writeContact(bc: bare.ByteCursor, x: Contact): void

export type Message = readonly (Contact)[]

export function readMessage(bc: bare.ByteCursor): Message

export function writeMessage(bc: bare.ByteCursor, x: Message): void

export function encodeMessage(x: Message): Uint8Array

export function decodeMessage(bytes: Uint8Array): Message
