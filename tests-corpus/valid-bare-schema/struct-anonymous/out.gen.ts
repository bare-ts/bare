import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type u8 = number
export type u16 = number

export type Person = {
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

export function encodePerson(x: Person): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes: Uint8Array): Person {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
