import * as bare from "@bare-ts/lib"

export function readPerson(bc) {
    return {
        name: bare.readString(bc),
        gender: (() => {
                const offset = bc.offset
                const tag = bare.readU8(bc)
                switch (tag) {
                    case 0:
                        return "FLUID"
                    case 1:
                        return "MALE"
                    case 2:
                        return "FEMALE"
                    default: {
                        bc.offset = offset
                        throw new bare.BareError(offset, "invalid tag")
                    }
                }
            })(),
    }
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    {
        switch (x.gender) {
            case "FLUID":
                bare.writeU8(bc, 0)
                break
            case "MALE":
                bare.writeU8(bc, 1)
                break
            case "FEMALE":
                bare.writeU8(bc, 2)
                break
        }
    }
}
