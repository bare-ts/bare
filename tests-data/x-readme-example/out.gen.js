import * as bare from "@bare-ts/lib"

const config = bare.Config({})


export const Gender = {
    FEMALE: "FEMALE",
    FLUID: "FLUID",
    MALE: "MALE"
}

export function decodeGender(bc) {
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

export function encodeGender(bc, x) {
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

export function decodePerson(bc) {
    const name = (bare.decodeString)(bc)
    const email = (bare.decodeString)(bc)
    const gender = (decode0)(bc)
    return {
        name,
        email,
        gender,
    }
}

export function encodePerson(bc, x) {
    (bare.encodeString)(bc, x.name);
    (bare.encodeString)(bc, x.email);
    (encode0)(bc, x.gender);
}

export function decodeOrganization(bc) {
    const name = (bare.decodeString)(bc)
    const email = (bare.decodeString)(bc)
    return {
        name,
        email,
    }
}

export function encodeOrganization(bc, x) {
    (bare.encodeString)(bc, x.name);
    (bare.encodeString)(bc, x.email);
}

export function decodeContact(bc) {
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

export function encodeContact(bc, x) {
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

export function decodeMessage(bc) {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decodeContact
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

export function encodeMessage(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (encodeContact)(bc, x[i])
    }
}

export function packMessage(x) {
    const bc = new bare.ByteCursor(
        new ArrayBuffer(config.initialBufferLength),
        config
    )
    encodeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function unpackMessage(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = decodeMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

function decode0(bc) {
    return bare.decodeBool(bc)
        ? (decodeGender)(bc)
        : undefined
}

function encode0(bc, x) {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (encodeGender)(bc, x)
    }
}
