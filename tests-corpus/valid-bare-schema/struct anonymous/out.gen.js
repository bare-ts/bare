import * as bare from "@bare-ts/lib"

export function readPerson(bc) {
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

export function writePerson(bc, x) {
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
