import * as bare from "@bare-ts/lib"


export const Gender = {
    FLUID: "FLUID",
    MALE: "MALE",
    FEMALE: "FEMALE"
}

export function decodeGender(bc) {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
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

export function encodeGender(bc, x) {
    switch (x) {
        case Gender.FLUID: {
            bare.encodeU8(bc, 0)
            break
        }
        case Gender.MALE: {
            bare.encodeU8(bc, 3)
            break
        }
        case Gender.FEMALE: {
            bare.encodeU8(bc, 4)
            break
        }
    }
}
