import * as bare from "@bare-ts/lib"

export class Person {
    constructor(
        name_,
        age_,
    ) {
        this.name = name_
        this.age = age_
    }
}

export function readPerson(bc) {
    return new Person(
        bare.readString(bc),
        bare.readU8(bc))
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
}
