import * as bare from "@bare-ts/lib"

export type i32 = number
export type i64Safe = number

export type PublicKey = ArrayBuffer

export function readPublicKey(bc: bare.ByteCursor): PublicKey

export function writePublicKey(bc: bare.ByteCursor, x: PublicKey): void

/**
 * ISO 8601
 */
export type Time = string

export function readTime(bc: bare.ByteCursor): Time

export function writeTime(bc: bare.ByteCursor, x: Time): void

export declare enum Department {
    Accounting = "Accounting",
    Administration = "Administration",
    CustomerService = "CustomerService",
    Development = "Development",
    /**
     * Reserved for the CEO
     */
    Jsmith = "Jsmith",
}

export function readDepartment(bc: bare.ByteCursor): Department

export function writeDepartment(bc: bare.ByteCursor, x: Department): void

export type Address = readonly string[]

export function readAddress(bc: bare.ByteCursor): Address

export function writeAddress(bc: bare.ByteCursor, x: Address): void

export type Customer = {
    readonly name: string
    readonly email: string
    readonly address: Address
    readonly orders: readonly ({
        readonly orderId: i64Safe
        readonly quantity: i32
    })[]
    readonly metadata: ReadonlyMap<string, ArrayBuffer>
}

export function readCustomer(bc: bare.ByteCursor): Customer

export function writeCustomer(bc: bare.ByteCursor, x: Customer): void

export type Employee = {
    readonly name: string
    readonly email: string
    readonly address: Address
    readonly department: Department
    readonly hireDate: Time
    readonly publicKey: PublicKey | null
    readonly metadata: ReadonlyMap<string, ArrayBuffer>
}

export function readEmployee(bc: bare.ByteCursor): Employee

export function writeEmployee(bc: bare.ByteCursor, x: Employee): void

export type TerminatedEmployee = null

export type Person =
    | { readonly tag: "Customer"; readonly val: Customer }
    | { readonly tag: "Employee"; readonly val: Employee }
    | { readonly tag: "TerminatedEmployee"; readonly val: TerminatedEmployee }

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void

export function encodePerson(x: Person, config?: Partial<bare.Config>): Uint8Array

export function decodePerson(bytes: Uint8Array): Person
