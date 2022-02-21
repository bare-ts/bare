import * as bare from "@bare-ts/lib"

export const Gender = {
    FLUID: 0,
    0: "FLUID",
    MALE: 1,
    1: "MALE",
    FEMALE: 2,
    2: "FEMALE"
}

export function readGender(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    if (tag > 2) {
        bc.offset = offset
        throw new bare.BareError(offset, "invalid tag")
    }
    return tag
}

export function writeGender(bc, x) {
    bare.writeU8(bc, x)
}
