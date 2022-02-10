import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

export type Person = ReturnType<typeof ext.Person>

export function readPerson(bc: bare.ByteCursor): Person {
    const name = (bare.readString)(bc)
    const age = (bare.readU8)(bc)
    return ext.Person(name, age)
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    (bare.writeString)(bc, x.name);
    (bare.writeU8)(bc, x.age);
}
