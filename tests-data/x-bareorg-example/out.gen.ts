import assert from "assert"
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

export type PublicKey = ArrayBuffer

export function decodePublicKey(bc: bare.ByteCursor): PublicKey {
    return bare.decodeFixedData(bc, 128)
}

export function encodePublicKey(bc: bare.ByteCursor, x: PublicKey): void {
    bare.encodeFixedData(bc, x, 128)
}

export type Time = string

export const decodeTime = bare.decodeString

export const encodeTime = bare.encodeString

export enum Department {
    ACCOUNTING = "ACCOUNTING",
    ADMINISTRATION = "ADMINISTRATION",
    CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
    DEVELOPMENT = "DEVELOPMENT",
    JSMITH = "JSMITH",
}

export function decodeDepartment(bc: bare.ByteCursor): Department {
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

export function encodeDepartment(bc: bare.ByteCursor, x: Department): void {
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

export function decodeCustomer(bc: bare.ByteCursor): Customer {
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

export function encodeCustomer(bc: bare.ByteCursor, x: Customer): void {
    (bare.encodeString)(bc, x.ame);
    (bare.encodeString)(bc, x.email);
    (encodeAddress)(bc, x.address);
    (encode0)(bc, x.orders);
    (encode1)(bc, x.metadata);
}

export interface Employee {
    readonly name: string
    readonly email: string
    readonly address: Address
    readonly department: Department
    readonly hireDate: Time
    readonly publicKey: PublicKey | undefined
    readonly metadata: ReadonlyMap<string, ArrayBuffer>
}

export function decodeEmployee(bc: bare.ByteCursor): Employee {
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

export function encodeEmployee(bc: bare.ByteCursor, x: Employee): void {
    (bare.encodeString)(bc, x.name);
    (bare.encodeString)(bc, x.email);
    (encodeAddress)(bc, x.address);
    (encodeDepartment)(bc, x.department);
    (encodeTime)(bc, x.hireDate);
    (encode2)(bc, x.publicKey);
    (encode3)(bc, x.metadata);
}

export type Person = 
    | { readonly tag: 0; readonly val: Customer }
    | { readonly tag: 1; readonly val: Employee }

export function decodePerson(bc: bare.ByteCursor): Person {
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

export function encodePerson(bc: bare.ByteCursor, x: Person): void {
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

export interface Address {
    readonly address: readonly (string)[]
    readonly city: string
    readonly state: string
    readonly country: string
}

export function decodeAddress(bc: bare.ByteCursor): Address {
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

export function encodeAddress(bc: bare.ByteCursor, x: Address): void {
    (encode4)(bc, x.address);
    (bare.encodeString)(bc, x.city);
    (bare.encodeString)(bc, x.state);
    (bare.encodeString)(bc, x.country);
}

export type Message = 
    | { readonly tag: 0; readonly val: Person }

export function decodeMessage(bc: bare.ByteCursor): Message {
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

export function encodeMessage(bc: bare.ByteCursor, x: Message): void {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (encodePerson)(bc, x.val)
            break
    }
}

export function packMessage(x: Message): Uint8Array {
    const bc = new bare.ByteCursor(
        new ArrayBuffer(config.initialBufferLength),
        config
    )
    encodeMessage(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function unpackMessage(bytes: ArrayBuffer | Uint8Array): Message {
    const bc = new bare.ByteCursor(bytes, config)
    const result = decodeMessage(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}

function decode0(bc: bare.ByteCursor): readonly ({
    readonly orderId: i64
    readonly quantity: i32
})[] {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decode5
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode0(bc: bare.ByteCursor, x: readonly ({
    readonly orderId: i64
    readonly quantity: i32
})[]): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (encode5)(bc, x[i])
    }
}

function decode1(bc: bare.ByteCursor): ReadonlyMap<string, ArrayBuffer> {
    const len = bare.decodeUintSafe(bc)
    const result = new Map<string, ArrayBuffer>()
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

function encode1(bc: bare.ByteCursor, x: ReadonlyMap<string, ArrayBuffer>): void {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (bare.encodeData)(bc, kv[1])
    }
}

function decode2(bc: bare.ByteCursor): PublicKey | undefined {
    return bare.decodeBool(bc)
        ? (decodePublicKey)(bc)
        : undefined
}

function encode2(bc: bare.ByteCursor, x: PublicKey | undefined): void {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (encodePublicKey)(bc, x)
    }
}

function decode3(bc: bare.ByteCursor): ReadonlyMap<string, ArrayBuffer> {
    const len = bare.decodeUintSafe(bc)
    const result = new Map<string, ArrayBuffer>()
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

function encode3(bc: bare.ByteCursor, x: ReadonlyMap<string, ArrayBuffer>): void {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (bare.encodeData)(bc, kv[1])
    }
}

function decode4(bc: bare.ByteCursor): readonly (string)[] {
    const len = 4
    const valDecoder = bare.decodeString
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode4(bc: bare.ByteCursor, x: readonly (string)[]): void {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        (bare.encodeString)(bc, x[i])
    }
}

function decode5(bc: bare.ByteCursor): {
    readonly orderId: i64
    readonly quantity: i32
} {
    const orderId = (bare.decodeI64)(bc)
    const quantity = (bare.decodeI32)(bc)
    return {
        orderId,
        quantity,
    }
}

function encode5(bc: bare.ByteCursor, x: {
    readonly orderId: i64
    readonly quantity: i32
}): void {
    (bare.encodeI64)(bc, x.orderId);
    (bare.encodeI32)(bc, x.quantity);
}
