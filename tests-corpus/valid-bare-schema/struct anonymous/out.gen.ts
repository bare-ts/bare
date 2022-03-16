import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number

export interface Person {
    readonly name: string
    readonly age: u8
    readonly address: {
        readonly country: string
        readonly city: {
            readonly name: string
            readonly code: u16
        }
        readonly street: string
    }
}

export function readPerson(bc: bare.ByteCursor): Person {
    return {
        name: bare.readString(bc),
        age: bare.readU8(bc),
        address: {
            country: bare.readString(bc),
            city: {
                name: bare.readString(bc),
                code: bare.readU16(bc),
            },
            street: bare.readString(bc),
        },
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
    {
        bare.writeString(bc, x.address.country)
        {
            bare.writeString(bc, x.address.city.name)
            bare.writeU16(bc, x.address.city.code)
        }
        bare.writeString(bc, x.address.street)
    }
}
