import * as bare from "@bare-ts/lib"

export class Person {
    constructor(
        name,
        age,
    ) {
        this.name = name
        this.age = age
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
