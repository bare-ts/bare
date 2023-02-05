import * as bare from "@bare-ts/lib"

export declare enum Gender {
    FEMALE = "FEMALE",
    FLUID = "FLUID",
    MALE = "MALE",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export type Person = {
    readonly name: string,
    readonly email: string,
    readonly gender: Gender | null,
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void

export type Organization = {
    readonly name: string,
    readonly email: string,
}

export function readOrganization(bc: bare.ByteCursor): Organization

export function writeOrganization(bc: bare.ByteCursor, x: Organization): void

export type Contact =
    | { readonly tag: "Person", readonly val: Person }
    | { readonly tag: "Organization", readonly val: Organization }

export function readContact(bc: bare.ByteCursor): Contact

export function writeContact(bc: bare.ByteCursor, x: Contact): void

export type Contacts = readonly Contact[]

export function readContacts(bc: bare.ByteCursor): Contacts

export function writeContacts(bc: bare.ByteCursor, x: Contacts): void

export function encodeContacts(x: Contacts): Uint8Array

export function decodeContacts(bytes: Uint8Array): Contacts
