import assert from "node:assert/strict"
import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

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
    Accounting: "Accounting",
    Administration: "Administration",
    CustomerService: "CustomerService",
    Development: "Development",
    Jsmith: "Jsmith",
}

export function readDepartment(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return Department.Accounting
        case 1:
            return Department.Administration
        case 2:
            return Department.CustomerService
        case 3:
            return Department.Development
        case 99:
            return Department.Jsmith
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeDepartment(bc, x) {
    switch (x) {
        case Department.Accounting: {
            bare.writeU8(bc, 0)
            break
        }
        case Department.Administration: {
            bare.writeU8(bc, 1)
            break
        }
        case Department.CustomerService: {
            bare.writeU8(bc, 2)
            break
        }
        case Department.Development: {
            bare.writeU8(bc, 3)
            break
        }
        case Department.Jsmith: {
            bare.writeU8(bc, 99)
            break
        }
    }
}

export function readAddress(bc) {
    const len = 4
    const result = [bare.readString(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readString(bc)
    }
    return result
}

export function writeAddress(bc, x) {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        bare.writeString(bc, x[i])
    }
}

function read0(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) {
        return []
    }
    const result = [{
        orderId: bare.readI64Safe(bc),
        quantity: bare.readI32(bc),
    }]
    for (let i = 1; i < len; i++) {
        result[i] = {
            orderId: bare.readI64Safe(bc),
            quantity: bare.readI32(bc),
        }
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        {
            bare.writeI64Safe(bc, x[i].orderId)
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
    for (const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeData(bc, kv[1])
    }
}

export function readCustomer(bc) {
    return {
        name: bare.readString(bc),
        email: bare.readString(bc),
        address: readAddress(bc),
        orders: read0(bc),
        metadata: read1(bc),
    }
}

export function writeCustomer(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
    writeAddress(bc, x.address)
    write0(bc, x.orders)
    write1(bc, x.metadata)
}

function read2(bc) {
    return bare.readBool(bc) ? readPublicKey(bc) : null
}

function write2(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        writePublicKey(bc, x)
    }
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
            return { tag: "Customer", val: readCustomer(bc) }
        case 1:
            return { tag: "Employee", val: readEmployee(bc) }
        case 2:
            return { tag: "TerminatedEmployee", val: null }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writePerson(bc, x) {
    switch (x.tag) {
        case "Customer": {
            bare.writeU8(bc, 0)
            writeCustomer(bc, x.val)
            break
        }
        case "Employee": {
            bare.writeU8(bc, 1)
            writeEmployee(bc, x.val)
            break
        }
        case "TerminatedEmployee": {
            bare.writeU8(bc, 2)
            break
        }
    }
}

export function encodePerson(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
