import * as bare from "@bare-ts/lib"

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

export function readPublicKey(bc: bare.ByteCursor): PublicKey

export function writePublicKey(bc: bare.ByteCursor, x: PublicKey): void

export type Time = string

export function readTime(bc: bare.ByteCursor): Time

export function writeTime(bc: bare.ByteCursor, x: Time): void

export declare enum Department {
    ACCOUNTING = "ACCOUNTING",
    ADMINISTRATION = "ADMINISTRATION",
    CUSTOMER_SERVICE = "CUSTOMER_SERVICE",
    DEVELOPMENT = "DEVELOPMENT",
    JSMITH = "JSMITH",
}

export function readDepartment(bc: bare.ByteCursor): Department

export function writeDepartment(bc: bare.ByteCursor, x: Department): void

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

export function readCustomer(bc: bare.ByteCursor): Customer

export function writeCustomer(bc: bare.ByteCursor, x: Customer): void

export interface Employee {
    readonly name: string
    readonly email: string
    readonly address: Address
    readonly department: Department
    readonly hireDate: Time
    readonly publicKey: PublicKey | undefined
    readonly metadata: ReadonlyMap<string, ArrayBuffer>
}

export function readEmployee(bc: bare.ByteCursor): Employee

export function writeEmployee(bc: bare.ByteCursor, x: Employee): void

export type Person = 
    | { readonly tag: 0; readonly val: Customer }
    | { readonly tag: 1; readonly val: Employee }

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void

export interface Address {
    readonly address: readonly (string)[]
    readonly city: string
    readonly state: string
    readonly country: string
}

export function readAddress(bc: bare.ByteCursor): Address

export function writeAddress(bc: bare.ByteCursor, x: Address): void

export type Message = 
    | { readonly tag: 0; readonly val: Person }

export function readMessage(bc: bare.ByteCursor): Message

export function writeMessage(bc: bare.ByteCursor, x: Message): void

export function encodeMessage(x: Message): Uint8Array

export function decodeMessage(bytes: Uint8Array): Message
