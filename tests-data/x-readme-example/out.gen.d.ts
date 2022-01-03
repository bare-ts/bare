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

export enum Gender {
    FEMALE = "FEMALE",
    FLUID = "FLUID",
    MALE = "MALE",
}

export function decodeGender(bc: bare.ByteCursor): Gender

export function encodeGender(bc: bare.ByteCursor, x: Gender): void

export interface Person {
    readonly name: string
    readonly email: string
    readonly gender: Gender | undefined
}

export function decodePerson(bc: bare.ByteCursor): Person

export function encodePerson(bc: bare.ByteCursor, x: Person): void

export interface Organization {
    readonly name: string
    readonly email: string
}

export function decodeOrganization(bc: bare.ByteCursor): Organization

export function encodeOrganization(bc: bare.ByteCursor, x: Organization): void

export type Contact = 
    | { readonly tag: 0; readonly val: Person }
    | { readonly tag: 1; readonly val: Organization }

export function decodeContact(bc: bare.ByteCursor): Contact

export function encodeContact(bc: bare.ByteCursor, x: Contact): void

export type Message = readonly (Contact)[]

export function decodeMessage(bc: bare.ByteCursor): Message

export function encodeMessage(bc: bare.ByteCursor, x: Message): void

export function packMessage(x: Message): Uint8Array

export function unpackMessage(bytes: ArrayBuffer | Uint8Array): Message
