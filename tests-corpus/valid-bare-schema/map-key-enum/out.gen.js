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

export function writeGender(bc, x) {
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

export function readGenderNames(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
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

export function writeGenderNames(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        writeGender(bc, kv[0])
        bare.writeString(bc, kv[1])
    }
}
