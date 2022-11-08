import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

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

function read0(bc: bare.ByteCursor): Gender | null {
    return bare.readBool(bc)
        ? readGender(bc)
        : null
}

function write0(bc: bare.ByteCursor, x: Gender | null): void {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        writeGender(bc, x)
    }
}

export type Person = {
    readonly name: string,
    readonly email: string,
    readonly gender: Gender | null,
}

export function readPerson(bc: bare.ByteCursor): Person {
    return {
        name: bare.readString(bc),
        email: bare.readString(bc),
        gender: read0(bc),
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
    write0(bc, x.gender)
}

export type Organization = {
    readonly name: string,
    readonly email: string,
}

export function readOrganization(bc: bare.ByteCursor): Organization {
    return {
        name: bare.readString(bc),
        email: bare.readString(bc),
    }
}

export function writeOrganization(bc: bare.ByteCursor, x: Organization): void {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
}

export type Contact =
    | { readonly tag: 0, readonly val: Person }
    | { readonly tag: 1, readonly val: Organization }

export function readContact(bc: bare.ByteCursor): Contact {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readPerson(bc) }
        case 1:
            return { tag, val: readOrganization(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeContact(bc: bare.ByteCursor, x: Contact): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0: {
            writePerson(bc, x.val)
            break
        }
        case 1: {
            writeOrganization(bc, x.val)
            break
        }
    }
}

export type Contacts = readonly Contact[]

export function readContacts(bc: bare.ByteCursor): Contacts {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [readContact(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = readContact(bc)
    }
    return result
}

export function writeContacts(bc: bare.ByteCursor, x: Contacts): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        writeContact(bc, x[i])
    }
}

export function encodeContacts(x: Contacts): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeContacts(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeContacts(bytes: Uint8Array): Contacts {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readContacts(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
