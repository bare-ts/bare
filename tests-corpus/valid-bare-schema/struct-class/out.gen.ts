import * as bare from "@bare-ts/lib"

export type u8 = number

export class Person {
    readonly name: string
    readonly age: u8
    constructor(
        name_: string,
        age_: u8,
    ) {
        this.name = name_
        this.age = age_
    }
}

export function readPerson(bc: bare.ByteCursor): Person {
    return new Person(
        bare.readString(bc),
        bare.readU8(bc),
    )
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
}

export function encodePerson(x: Person, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes: Uint8Array): Person {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
