import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"


export function decodePerson(bc) {
    const name = (bare.decodeString)(bc)
    const age = (bare.decodeU8)(bc)
    return ext.Person(name,age)
}

export function encodePerson(bc, x) {
    (bare.encodeString)(bc, x.name);
    (bare.encodeU8)(bc, x.age);
}
