import * as bare from "@bare-ts/lib"

const config = bare.Config({})

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

export function readPerson(bc) {
    const name = (bare.readString)(bc)
    const email = (bare.readString)(bc)
    const gender = (read0)(bc)
    return {
        name,
        email,
        gender,
    }
}

export function writePerson(bc, x) {
    (bare.writeString)(bc, x.name);
    (bare.writeString)(bc, x.email);
    (write0)(bc, x.gender);
}

export function readOrganization(bc) {
    const name = (bare.readString)(bc)
    const email = (bare.readString)(bc)
    return {
        name,
        email,
    }
}

export function writeOrganization(bc, x) {
    (bare.writeString)(bc, x.name);
    (bare.writeString)(bc, x.email);
}

export function readContact(bc) {
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

export function writeContact(bc, x) {
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

export function readMessage(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = readContact
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeMessage(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (writeContact)(bc, x[i])
    }
}

export function encodeMessage(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeMessage(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

function read0(bc) {
    return bare.readBool(bc)
        ? (readGender)(bc)
        : null
}

function write0(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (writeGender)(bc, x)
    }
}
