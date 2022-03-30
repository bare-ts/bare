import * as bare from "@bare-ts/lib"

export interface Person {
    readonly name: string
    readonly gender: 0 | 1 | 2
}

export function readPerson(bc: bare.ByteCursor): Person {
    return {
        name: bare.readString(bc),
        gender: (() => {
                const offset = bc.offset
                const tag = bare.readU8(bc)
                if (tag > 2) {
                    bc.offset = offset
                    throw new bare.BareError(offset, "invalid tag")
                }
                return tag as 0 | 1 | 2
            })(),
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
    {
        bare.writeU8(bc, x.gender)
    }
}
