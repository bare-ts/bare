import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readPerson(bc) {
    return {
        name: bare.readString(bc),
        age: bare.readU8(bc),
        address: {
            country: bare.readString(bc),
            city: {
                name: bare.readString(bc),
                code: bare.readU16(bc),
            },
            street: bare.readString(bc),
        },
    }
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
    bare.writeU8(bc, x.age)
    {
        bare.writeString(bc, x.address.country)
        {
            bare.writeString(bc, x.address.city.name)
            bare.writeU16(bc, x.address.city.code)
        }
        bare.writeString(bc, x.address.street)
    }
}

export function encodePerson(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writePerson(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodePerson(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readPerson(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
