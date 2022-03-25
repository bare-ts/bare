import * as bare from "@bare-ts/lib"

export enum Gender {
    FLUID = 0,
    MALE = 1,
    FEMALE = 2,
}

export function readGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    if (tag > 2) {
        bc.offset = offset
        throw new bare.BareError(offset, "invalid tag")
    }
    return tag as Gender
}

export function writeGender(bc: bare.ByteCursor, x: Gender): void {
    bare.writeU8(bc, x)
}
