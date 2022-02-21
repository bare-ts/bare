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
    const name = (bare.readString)(bc)
    const age = (bare.readU8)(bc)
    return new Person(name, age)
}

export function writePerson(bc, x) {
    (bare.writeString)(bc, x.name);
    (bare.writeU8)(bc, x.age);
}
