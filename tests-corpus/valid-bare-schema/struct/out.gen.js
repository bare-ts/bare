import * as bare from "@bare-ts/lib"

export function readPerson(bc) {
    return {
        name: bare.readString(bc),
        age: bare.readU8(bc),
    }
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
}

export function encodePerson(x, config) {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes) {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
