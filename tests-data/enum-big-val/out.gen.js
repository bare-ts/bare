import * as bare from "@bare-ts/lib"


export const Gender = {
    MALE: 1,
    1: "MALE",
    FEMALE: 2,
    2: "FEMALE",
    FLUID: 9007199254740991,
    9007199254740991: "FLUID"
}

export function readGender(bc) {
    const offset = bc.offset
    const tag = bare.readUintSafe(bc)
    switch (tag) {
        case 1:
            return Gender.MALE
        case 2:
            return Gender.FEMALE
        case 9007199254740991:
            return Gender.FLUID
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc, x) {
    bare.writeUintSafe(bc, x)
}
