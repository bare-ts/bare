import * as bare from "@bare-ts/lib"

export type u8 = number

export interface Person {
    name: string
    age: u8
}

export function readPerson(bc: bare.ByteCursor): Person {
    return {
        name: bare.readString(bc),
        age: bare.readU8(bc),
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
}
