import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export class Person {
    constructor(
        name_,
        age_,
    ) {
        this.name = name_
        this.age = age_
    }
}

export function readPerson(bc) {
    return new Person(
        bare.readString(bc),
        bare.readU8(bc),
    )
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
}

export function encodePerson(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config,
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
