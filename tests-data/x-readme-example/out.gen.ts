import * as bare from "@bare-ts/lib"

const config = bare.Config({})

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

export function decodeGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0:
            return Gender.FEMALE
        case 1:
            return Gender.FLUID
        case 2:
            return Gender.MALE
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeGender(bc: bare.ByteCursor, x: Gender): void {
    switch (x) {
        case Gender.FEMALE: {
            bare.encodeU8(bc, 0)
            break
        }
        case Gender.FLUID: {
            bare.encodeU8(bc, 1)
            break
        }
        case Gender.MALE: {
            bare.encodeU8(bc, 2)
            break
        }
    }
}

export interface Person {
    readonly name: string
    readonly email: string
    readonly gender: Gender | undefined
}

export function decodePerson(bc: bare.ByteCursor): Person {
    const name = (bare.decodeString)(bc)
    const email = (bare.decodeString)(bc)
    const gender = (decode0)(bc)
    return {
        name,
        email,
        gender,
    }
}

export function encodePerson(bc: bare.ByteCursor, x: Person): void {
    (bare.encodeString)(bc, x.name);
    (bare.encodeString)(bc, x.email);
    (encode0)(bc, x.gender);
}

export interface Organization {
    readonly name: string
    readonly email: string
}

export function decodeOrganization(bc: bare.ByteCursor): Organization {
    const name = (bare.decodeString)(bc)
    const email = (bare.decodeString)(bc)
    return {
        name,
        email,
    }
}

export function encodeOrganization(bc: bare.ByteCursor, x: Organization): void {
    (bare.encodeString)(bc, x.name);
    (bare.encodeString)(bc, x.email);
}

export type Contact = 
    | { readonly tag: 0; readonly val: Person }
    | { readonly tag: 1; readonly val: Organization }

export function decodeContact(bc: bare.ByteCursor): Contact {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0: {
            const val = (decodePerson)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (decodeOrganization)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeContact(bc: bare.ByteCursor, x: Contact): void {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (encodePerson)(bc, x.val)
            break
        case 1:
            (encodeOrganization)(bc, x.val)
            break
    }
}

export type Message = readonly (Contact)[]

export function decodeMessage(bc: bare.ByteCursor): Message {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decodeContact
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeMessage(bc: bare.ByteCursor, x: Message): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (encodeContact)(bc, x[i])
    }
}

export function packMessage(x: Message): Uint8Array {
    const bc = new bare.ByteCursor(
        new ArrayBuffer(config.initialBufferLength),
        config
    )
    encodeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function unpackMessage(bytes: ArrayBuffer | Uint8Array): Message {
    const bc = new bare.ByteCursor(bytes, config)
    const result = decodeMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

function decode0(bc: bare.ByteCursor): Gender | undefined {
    return bare.decodeBool(bc)
        ? (decodeGender)(bc)
        : undefined
}

function encode0(bc: bare.ByteCursor, x: Gender | undefined): void {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (encodeGender)(bc, x)
    }
}
