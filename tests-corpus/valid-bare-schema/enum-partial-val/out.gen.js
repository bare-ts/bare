import * as bare from "@bare-ts/lib"

export const Gender = {
    FLUID: "FLUID",
    MALE: "MALE",
    FEMALE: "FEMALE"
}

export function readGender(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return Gender.FLUID
        case 3:
            return Gender.MALE
        case 4:
            return Gender.FEMALE
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc, x) {
    switch (x) {
        case Gender.FLUID: {
            bare.writeU8(bc, 0)
            break
        }
        case Gender.MALE: {
            bare.writeU8(bc, 3)
            break
        }
        case Gender.FEMALE: {
            bare.writeU8(bc, 4)
            break
        }
    }
}