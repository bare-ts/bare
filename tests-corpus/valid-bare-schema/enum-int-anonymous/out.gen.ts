import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

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
