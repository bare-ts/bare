import * as bare from "@bare-ts/lib"

export type u8 = number

export interface Person {
    readonly name: string
    readonly age: u8
}

export function readPerson(bc: bare.ByteCursor): Person {
    const name = (bare.readString)(bc)
    const age = (bare.readU8)(bc)
    return {
        name,
        age,
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    (bare.writeString)(bc, x.name);
    (bare.writeU8)(bc, x.age);
}
