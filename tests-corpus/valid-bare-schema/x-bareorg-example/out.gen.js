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

export function readTime(bc) {
    return bare.readString(bc)
}

export function writeTime(bc, x) {
    bare.writeString(bc, x)
}

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
        case Department.ACCOUNTING:
            bare.writeU8(bc, 0)
            break
        case Department.ADMINISTRATION:
            bare.writeU8(bc, 1)
            break
        case Department.CUSTOMER_SERVICE:
            bare.writeU8(bc, 2)
            break
        case Department.DEVELOPMENT:
            bare.writeU8(bc, 3)
            break
        case Department.JSMITH:
            bare.writeU8(bc, 99)
            break
    }
}

export function readCustomer(bc) {
    return {
        ame: bare.readString(bc),
        email: bare.readString(bc),
        address: readAddress(bc),
        orders: read0(bc),
        metadata: read1(bc),
    }
}

export function writeCustomer(bc, x) {
    bare.writeString(bc, x.ame)
    bare.writeString(bc, x.email)
    writeAddress(bc, x.address)
    write0(bc, x.orders)
    write1(bc, x.metadata)
}

export function readEmployee(bc) {
    return {
        name: bare.readString(bc),
        email: bare.readString(bc),
        address: readAddress(bc),
        department: readDepartment(bc),
        hireDate: readTime(bc),
        publicKey: read2(bc),
        metadata: read1(bc),
    }
}

export function writeEmployee(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
    writeAddress(bc, x.address)
    writeDepartment(bc, x.department)
    writeTime(bc, x.hireDate)
    write2(bc, x.publicKey)
    write1(bc, x.metadata)
}

export function readPerson(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readCustomer(bc) }
        case 1:
            return { tag, val: readEmployee(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writePerson(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            writeCustomer(bc, x.val)
            break
        case 1:
            writeEmployee(bc, x.val)
            break
    }
}

export function readAddress(bc) {
    return {
        address: read3(bc),
        city: bare.readString(bc),
        state: bare.readString(bc),
        country: bare.readString(bc),
    }
}

export function writeAddress(bc, x) {
    write3(bc, x.address)
    bare.writeString(bc, x.city)
    bare.writeString(bc, x.state)
    bare.writeString(bc, x.country)
}

export function readMessage(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readPerson(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeMessage(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            writePerson(bc, x.val)
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
    const result = [{
        orderId: bare.readI64(bc),
        quantity: bare.readI32(bc),
    }]
    for (let i = 1; i < len; i++) {
        result[i] = {
            orderId: bare.readI64(bc),
            quantity: bare.readI32(bc),
        }
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        {
            bare.writeI64(bc, x[i].orderId)
            bare.writeI32(bc, x[i].quantity)
        }
    }
}

function read1(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = bare.readString(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, bare.readData(bc))
    }
    return result
}

function write1(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeData(bc, kv[1])
    }
}

function read2(bc) {
    return bare.readBool(bc)
        ? readPublicKey(bc)
        : null
}

function write2(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        writePublicKey(bc, x)
    }
}

function read3(bc) {
    const len = 4
    const result = [bare.readString(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readString(bc)
    }
    return result
}

function write3(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        bare.writeString(bc, x[i])
    }
}
