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

export function readGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.readU8(bc)
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

export function writeGender(bc: bare.ByteCursor, x: Gender): void {
    switch (x) {
        case Gender.FEMALE: {
            bare.writeU8(bc, 0)
            break
        }
        case Gender.FLUID: {
            bare.writeU8(bc, 1)
            break
        }
        case Gender.MALE: {
            bare.writeU8(bc, 2)
            break
        }
    }
}

export interface Person {
    readonly name: string
    readonly email: string
    readonly gender: Gender | undefined
}

export function readPerson(bc: bare.ByteCursor): Person {
    const name = (bare.readString)(bc)
    const email = (bare.readString)(bc)
    const gender = (read0)(bc)
    return {
        name,
        email,
        gender,
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    (bare.writeString)(bc, x.name);
    (bare.writeString)(bc, x.email);
    (write0)(bc, x.gender);
}

export interface Organization {
    readonly name: string
    readonly email: string
}

export function readOrganization(bc: bare.ByteCursor): Organization {
    const name = (bare.readString)(bc)
    const email = (bare.readString)(bc)
    return {
        name,
        email,
    }
}

export function writeOrganization(bc: bare.ByteCursor, x: Organization): void {
    (bare.writeString)(bc, x.name);
    (bare.writeString)(bc, x.email);
}

export type Contact = 
    | { readonly tag: 0; readonly val: Person }
    | { readonly tag: 1; readonly val: Organization }

export function readContact(bc: bare.ByteCursor): Contact {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (readPerson)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (readOrganization)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeContact(bc: bare.ByteCursor, x: Contact): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (writePerson)(bc, x.val)
            break
        case 1:
            (writeOrganization)(bc, x.val)
            break
    }
}

export type Message = readonly (Contact)[]

export function readMessage(bc: bare.ByteCursor): Message {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = readContact
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeMessage(bc: bare.ByteCursor, x: Message): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (writeContact)(bc, x[i])
    }
}

export function encodeMessage(x: Message): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMessage(bytes: Uint8Array): Message {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

function read0(bc: bare.ByteCursor): Gender | undefined {
    return bare.readBool(bc)
        ? (readGender)(bc)
        : undefined
}

function write0(bc: bare.ByteCursor, x: Gender | undefined): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (writeGender)(bc, x)
    }
}
