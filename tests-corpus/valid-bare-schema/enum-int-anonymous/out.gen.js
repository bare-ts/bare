import * as bare from "@bare-ts/lib"

export function readPerson(bc) {
    return {
        name: bare.readString(bc),
        gender: (() => {
                const offset = bc.offset
                const tag = bare.readU8(bc)
                if (tag > 2) {
                    bc.offset = offset
                    throw new bare.BareError(offset, "invalid tag")
                }
                return tag
            })(),
    }
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    {
        bare.writeU8(bc, x.gender)
    }
}
