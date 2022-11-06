import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export type Person = {
    readonly name: string,
    readonly gender: "FLUID" | "MALE" | "FEMALE",
}

export function readPerson(bc: bare.ByteCursor): Person {
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

export function writePerson(bc: bare.ByteCursor, x: Person): void {
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

export function encodePerson(x: Person): Uint8Array {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes: Uint8Array): Person {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
