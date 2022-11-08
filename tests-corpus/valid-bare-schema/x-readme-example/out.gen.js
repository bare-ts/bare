import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export const Gender = {
    FEMALE: "FEMALE",
    FLUID: "FLUID",
    MALE: "MALE"
}

export function readGender(bc) {
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

export function writeGender(bc, x) {
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

function read0(bc) {
    return bare.readBool(bc)
        ? readGender(bc)
        : null
}

function write0(bc, x) {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        writeGender(bc, x)
    }
}

export function readPerson(bc) {
    return {
        name: bare.readString(bc),
        email: bare.readString(bc),
        gender: read0(bc),
    }
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
    write0(bc, x.gender)
}

export function readOrganization(bc) {
    return {
        name: bare.readString(bc),
        email: bare.readString(bc),
    }
}

export function writeOrganization(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
}

export function readContact(bc) {
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

export function writeContact(bc, x) {
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

export function readContacts(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [readContact(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = readContact(bc)
    }
    return result
}

export function writeContacts(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        writeContact(bc, x[i])
    }
}

export function encodeContacts(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeContacts(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeContacts(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readContacts(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
