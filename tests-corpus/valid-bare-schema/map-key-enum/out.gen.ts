import * as bare from "@bare-ts/lib"

export enum Gender {
    FLUID = "FLUID",
    MALE = "MALE",
    FEMALE = "FEMALE",
}

export function readGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return Gender.FLUID
        case 1:
            return Gender.MALE
        case 2:
            return Gender.FEMALE
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc: bare.ByteCursor, x: Gender): void {
    switch (x) {
        case Gender.FLUID:
            bare.writeU8(bc, 0)
            break
        case Gender.MALE:
            bare.writeU8(bc, 1)
            break
        case Gender.FEMALE:
            bare.writeU8(bc, 2)
            break
    }
}

export type GenderNames = ReadonlyMap<Gender, string>

export function readGenderNames(bc: bare.ByteCursor): GenderNames {
    const len = bare.readUintSafe(bc)
    const result = new Map<Gender, string>()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = readGender(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, bare.readString(bc))
    }
    return result
}

export function writeGenderNames(bc: bare.ByteCursor, x: GenderNames): void {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        writeGender(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}
