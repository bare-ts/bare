import * as bare from "@bare-ts/lib"


export const Gender = {
    MALE: "MALE",
    FEMALE: "FEMALE",
    FLUID: "FLUID"
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
    switch (x) {
        case Gender.MALE: {
            bare.writeUintSafe(bc, 1)
            break
        }
        case Gender.FEMALE: {
            bare.writeUintSafe(bc, 2)
            break
        }
        case Gender.FLUID: {
            bare.writeUintSafe(bc, 9007199254740991)
            break
        }
    }
}
