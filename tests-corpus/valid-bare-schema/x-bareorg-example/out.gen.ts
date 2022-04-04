import assert from "assert"
import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type i32 = number
export type i64 = bigint

export type PublicKey = ArrayBuffer

export function readPublicKey(bc: bare.ByteCursor): PublicKey {
    return bare.readFixedData(bc, 128)
}

export function writePublicKey(bc: bare.ByteCursor, x: PublicKey): void {
    assert(x.byteLength === 128)
    bare.writeFixedData(bc, x)
}

export type Time = string

export function readTime(bc: bare.ByteCursor): Time {
    return bare.readString(bc)
}

export function writeTime(bc: bare.ByteCursor, x: Time): void {
    bare.writeString(bc, x)
}

export enum Department {
    ACCOUNTING = "ACCOUNTING",
    ADMINISTRATION = "ADMINISTRATION",
    CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
    DEVELOPMENT = "DEVELOPMENT",
    JSMITH = "JSMITH",
}

export function readDepartment(bc: bare.ByteCursor): Department {
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

export function writeDepartment(bc: bare.ByteCursor, x: Department): void {
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

export interface Customer {
    readonly ame: string
    readonly email: string
    readonly address: Address
    readonly orders: readonly ({
        readonly orderId: i64
        readonly quantity: i32
    })[]
    readonly metadata: ReadonlyMap<string, ArrayBuffer>
}

export function readCustomer(bc: bare.ByteCursor): Customer {
    return {
        ame: bare.readString(bc),
        email: bare.readString(bc),
        address: readAddress(bc),
        orders: read0(bc),
        metadata: read1(bc),
    }
}

export function writeCustomer(bc: bare.ByteCursor, x: Customer): void {
    bare.writeString(bc, x.ame)
    bare.writeString(bc, x.email)
    writeAddress(bc, x.address)
    write0(bc, x.orders)
    write1(bc, x.metadata)
}

export interface Employee {
    readonly name: string
    readonly email: string
    readonly address: Address
    readonly department: Department
    readonly hireDate: Time
    readonly publicKey: PublicKey | null
    readonly metadata: ReadonlyMap<string, ArrayBuffer>
}

export function readEmployee(bc: bare.ByteCursor): Employee {
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

export function writeEmployee(bc: bare.ByteCursor, x: Employee): void {
    bare.writeString(bc, x.name)
    bare.writeString(bc, x.email)
    writeAddress(bc, x.address)
    writeDepartment(bc, x.department)
    writeTime(bc, x.hireDate)
    write2(bc, x.publicKey)
    write1(bc, x.metadata)
}

export type Person = 
    | { readonly tag: 0; readonly val: Customer }
    | { readonly tag: 1; readonly val: Employee }

export function readPerson(bc: bare.ByteCursor): Person {
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

export function writePerson(bc: bare.ByteCursor, x: Person): void {
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

export interface Address {
    readonly address: readonly string[]
    readonly city: string
    readonly state: string
    readonly country: string
}

export function readAddress(bc: bare.ByteCursor): Address {
    return {
        address: read3(bc),
        city: bare.readString(bc),
        state: bare.readString(bc),
        country: bare.readString(bc),
    }
}

export function writeAddress(bc: bare.ByteCursor, x: Address): void {
    write3(bc, x.address)
    bare.writeString(bc, x.city)
    bare.writeString(bc, x.state)
    bare.writeString(bc, x.country)
}

export type Message = 
    | { readonly tag: 0; readonly val: Person }

export function readMessage(bc: bare.ByteCursor): Message {
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

export function writeMessage(bc: bare.ByteCursor, x: Message): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            writePerson(bc, x.val)
            break
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

function read0(bc: bare.ByteCursor): readonly ({
    readonly orderId: i64
    readonly quantity: i32
})[] {
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

function write0(bc: bare.ByteCursor, x: readonly ({
    readonly orderId: i64
    readonly quantity: i32
})[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        {
            bare.writeI64(bc, x[i].orderId)
            bare.writeI32(bc, x[i].quantity)
        }
    }
}

function read1(bc: bare.ByteCursor): ReadonlyMap<string, ArrayBuffer> {
    const len = bare.readUintSafe(bc)
    const result = new Map<string, ArrayBuffer>()
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

function write1(bc: bare.ByteCursor, x: ReadonlyMap<string, ArrayBuffer>): void {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        bare.writeString(bc, kv[0])
        bare.writeData(bc, kv[1])
    }
}

function read2(bc: bare.ByteCursor): PublicKey | null {
    return bare.readBool(bc)
        ? readPublicKey(bc)
        : null
}

function write2(bc: bare.ByteCursor, x: PublicKey | null): void {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        writePublicKey(bc, x)
    }
}

function read3(bc: bare.ByteCursor): readonly string[] {
    const len = 4
    const result = [bare.readString(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readString(bc)
    }
    return result
}

function write3(bc: bare.ByteCursor, x: readonly string[]): void {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        bare.writeString(bc, x[i])
    }
}
