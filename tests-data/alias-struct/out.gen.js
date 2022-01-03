import * as bare from "@bare-ts/lib"


export function decodePerson(bc) {
    const name = (bare.decodeString)(bc)
    const age = (bare.decodeU8)(bc)
    return {
        name,
        age,
    }
}

export function encodePerson(bc, x) {
    (bare.encodeString)(bc, x.name);
    (bare.encodeU8)(bc, x.age);
}
