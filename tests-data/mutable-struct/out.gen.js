import * as bare from "@bare-ts/lib"


export function readPerson(bc) {
    const name = (bare.readString)(bc)
    const age = (bare.readU8)(bc)
    return {
        name,
        age,
    }
}

export function writePerson(bc, x) {
    (bare.writeString)(bc, x.name);
    (bare.writeU8)(bc, x.age);
}
