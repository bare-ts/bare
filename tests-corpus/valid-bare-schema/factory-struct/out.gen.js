import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

export function readPerson(bc) {
    return ext.Person(
        bare.readString(bc),
        bare.readU8(bc)
    )
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
}
