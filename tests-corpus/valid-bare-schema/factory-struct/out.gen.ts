import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

const config = /* @__PURE__ */ bare.Config({})

export type Person = ReturnType<typeof ext.Person>

export function readPerson(bc: bare.ByteCursor): Person {
    return ext.Person(
        bare.readString(bc),
        bare.readU8(bc)
    )
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
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
