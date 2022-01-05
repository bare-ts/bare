import assert from "assert"
import * as bare from "@bare-ts/lib"

const config = bare.Config({})


export function decodePublicKey(bc) {
    return bare.decodeFixedData(bc, 128)
}

export function encodePublicKey(bc, x) {
    bare.encodeFixedData(bc, x, 128)
}

export const decodeTime = bare.decodeString

export const encodeTime = bare.encodeString

export const Department = {
    ACCOUNTING: "ACCOUNTING",
    ADMINISTRATION: "ADMINISTRATION",
    CUSTOMER_SERVICE: "CUSTOMER_SERVICE",
    DEVELOPMENT: "DEVELOPMENT",
    JSMITH: "JSMITH"
}

export function decodeDepartment(bc) {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0:
            return Department.ACCOUNTING
        case 1:
            return Department.ADMINISTRATION
        case 2:
            return Department.CUSTOMER_SERVICE
        case 3:
            return Department.DEVELOPMENT
        case 99:
            return Department.JSMITH
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeDepartment(bc, x) {
    switch (x) {
        case Department.ACCOUNTING: {
            bare.encodeU8(bc, 0)
            break
        }
        case Department.ADMINISTRATION: {
            bare.encodeU8(bc, 1)
            break
        }
        case Department.CUSTOMER_SERVICE: {
            bare.encodeU8(bc, 2)
            break
        }
        case Department.DEVELOPMENT: {
            bare.encodeU8(bc, 3)
            break
        }
        case Department.JSMITH: {
            bare.encodeU8(bc, 99)
            break
        }
    }
}

export function decodeCustomer(bc) {
    const ame = (bare.decodeString)(bc)
    const email = (bare.decodeString)(bc)
    const address = (decodeAddress)(bc)
    const orders = (decode0)(bc)
    const metadata = (decode1)(bc)
    return {
        ame,
        email,
        address,
        orders,
        metadata,
    }
}

export function encodeCustomer(bc, x) {
    (bare.encodeString)(bc, x.ame);
    (bare.encodeString)(bc, x.email);
    (encodeAddress)(bc, x.address);
    (encode0)(bc, x.orders);
    (encode1)(bc, x.metadata);
}

export function decodeEmployee(bc) {
    const name = (bare.decodeString)(bc)
    const email = (bare.decodeString)(bc)
    const address = (decodeAddress)(bc)
    const department = (decodeDepartment)(bc)
    const hireDate = (decodeTime)(bc)
    const publicKey = (decode2)(bc)
    const metadata = (decode3)(bc)
    return {
        name,
        email,
        address,
        department,
        hireDate,
        publicKey,
        metadata,
    }
}

export function encodeEmployee(bc, x) {
    (bare.encodeString)(bc, x.name);
    (bare.encodeString)(bc, x.email);
    (encodeAddress)(bc, x.address);
    (encodeDepartment)(bc, x.department);
    (encodeTime)(bc, x.hireDate);
    (encode2)(bc, x.publicKey);
    (encode3)(bc, x.metadata);
}

export function decodePerson(bc) {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0: {
            const val = (decodeCustomer)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (decodeEmployee)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodePerson(bc, x) {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (encodeCustomer)(bc, x.val)
            break
        case 1:
            (encodeEmployee)(bc, x.val)
            break
    }
}

export function decodeAddress(bc) {
    const address = (decode4)(bc)
    const city = (bare.decodeString)(bc)
    const state = (bare.decodeString)(bc)
    const country = (bare.decodeString)(bc)
    return {
        address,
        city,
        state,
        country,
    }
}

export function encodeAddress(bc, x) {
    (encode4)(bc, x.address);
    (bare.encodeString)(bc, x.city);
    (bare.encodeString)(bc, x.state);
    (bare.encodeString)(bc, x.country);
}

export function decodeMessage(bc) {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0: {
            const val = (decodePerson)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeMessage(bc, x) {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (encodePerson)(bc, x.val)
            break
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
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decode5
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode0(bc, x) {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (encode5)(bc, x[i])
    }
}

function decode1(bc) {
    const len = bare.decodeUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.decodeString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (bare.decodeData)(bc))
    }
    return result
}

function encode1(bc, x) {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (bare.encodeData)(bc, kv[1])
    }
}

function decode2(bc) {
    return bare.decodeBool(bc)
        ? (decodePublicKey)(bc)
        : undefined
}

function encode2(bc, x) {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (encodePublicKey)(bc, x)
    }
}

function decode3(bc) {
    const len = bare.decodeUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.decodeString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (bare.decodeData)(bc))
    }
    return result
}

function encode3(bc, x) {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (bare.encodeData)(bc, kv[1])
    }
}

function decode4(bc) {
    const len = 4
    const valDecoder = bare.decodeString
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode4(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        (bare.encodeString)(bc, x[i])
    }
}

function decode5(bc) {
    const orderId = (bare.decodeI64)(bc)
    const quantity = (bare.decodeI32)(bc)
    return {
        orderId,
        quantity,
    }
}

function encode5(bc, x) {
    (bare.encodeI64)(bc, x.orderId);
    (bare.encodeI32)(bc, x.quantity);
}
