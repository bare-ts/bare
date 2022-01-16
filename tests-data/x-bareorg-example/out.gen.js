import assert from "assert"
import * as bare from "@bare-ts/lib"

const config = bare.Config({})


export function readPublicKey(bc) {
    return bare.readFixedData(bc, 128)
}

export function writePublicKey(bc, x) {
    assert(x.byteLength === 128)
    bare.writeFixedData(bc, x)
}

export const readTime = bare.readString

export const writeTime = bare.writeString

export const Department = {
    ACCOUNTING: "ACCOUNTING",
    ADMINISTRATION: "ADMINISTRATION",
    CUSTOMER_SERVICE: "CUSTOMER_SERVICE",
    DEVELOPMENT: "DEVELOPMENT",
    JSMITH: "JSMITH"
}

export function readDepartment(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
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

export function writeDepartment(bc, x) {
    switch (x) {
        case Department.ACCOUNTING: {
            bare.writeU8(bc, 0)
            break
        }
        case Department.ADMINISTRATION: {
            bare.writeU8(bc, 1)
            break
        }
        case Department.CUSTOMER_SERVICE: {
            bare.writeU8(bc, 2)
            break
        }
        case Department.DEVELOPMENT: {
            bare.writeU8(bc, 3)
            break
        }
        case Department.JSMITH: {
            bare.writeU8(bc, 99)
            break
        }
    }
}

export function readCustomer(bc) {
    const ame = (bare.readString)(bc)
    const email = (bare.readString)(bc)
    const address = (readAddress)(bc)
    const orders = (read0)(bc)
    const metadata = (read1)(bc)
    return {
        ame,
        email,
        address,
        orders,
        metadata,
    }
}

export function writeCustomer(bc, x) {
    (bare.writeString)(bc, x.ame);
    (bare.writeString)(bc, x.email);
    (writeAddress)(bc, x.address);
    (write0)(bc, x.orders);
    (write1)(bc, x.metadata);
}

export function readEmployee(bc) {
    const name = (bare.readString)(bc)
    const email = (bare.readString)(bc)
    const address = (readAddress)(bc)
    const department = (readDepartment)(bc)
    const hireDate = (readTime)(bc)
    const publicKey = (read2)(bc)
    const metadata = (read3)(bc)
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

export function writeEmployee(bc, x) {
    (bare.writeString)(bc, x.name);
    (bare.writeString)(bc, x.email);
    (writeAddress)(bc, x.address);
    (writeDepartment)(bc, x.department);
    (writeTime)(bc, x.hireDate);
    (write2)(bc, x.publicKey);
    (write3)(bc, x.metadata);
}

export function readPerson(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (readCustomer)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (readEmployee)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writePerson(bc, x) {
    const tag = x.tag;
    bare.writeU8(bc, tag)
    switch (tag) {
        case 0:
            (writeCustomer)(bc, x.val)
            break
        case 1:
            (writeEmployee)(bc, x.val)
            break
    }
}

export function readAddress(bc) {
    const address = (read4)(bc)
    const city = (bare.readString)(bc)
    const state = (bare.readString)(bc)
    const country = (bare.readString)(bc)
    return {
        address,
        city,
        state,
        country,
    }
}

export function writeAddress(bc, x) {
    (write4)(bc, x.address);
    (bare.writeString)(bc, x.city);
    (bare.writeString)(bc, x.state);
    (bare.writeString)(bc, x.country);
}

export function readMessage(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (readPerson)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeMessage(bc, x) {
    const tag = x.tag;
    bare.writeU8(bc, tag)
    switch (tag) {
        case 0:
            (writePerson)(bc, x.val)
            break
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
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = read5
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (write5)(bc, x[i])
    }
}

function read1(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.readString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (bare.readData)(bc))
    }
    return result
}

function write1(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (bare.writeData)(bc, kv[1])
    }
}

function read2(bc) {
    return bare.readBool(bc)
        ? (readPublicKey)(bc)
        : undefined
}

function write2(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (writePublicKey)(bc, x)
    }
}

function read3(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.readString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (bare.readData)(bc))
    }
    return result
}

function write3(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (bare.writeData)(bc, kv[1])
    }
}

function read4(bc) {
    const len = 4
    const valReader = bare.readString
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write4(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        (bare.writeString)(bc, x[i])
    }
}

function read5(bc) {
    const orderId = (bare.readI64)(bc)
    const quantity = (bare.readI32)(bc)
    return {
        orderId,
        quantity,
    }
}

function write5(bc, x) {
    (bare.writeI64)(bc, x.orderId);
    (bare.writeI32)(bc, x.quantity);
}
