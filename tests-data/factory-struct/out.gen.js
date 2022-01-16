import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"


export function readPerson(bc) {
    const name = (bare.readString)(bc)
    const age = (bare.readU8)(bc)
    return ext.Person(name,age)
}

export function writePerson(bc, x) {
    (bare.writeString)(bc, x.name);
    (bare.writeU8)(bc, x.age);
}
