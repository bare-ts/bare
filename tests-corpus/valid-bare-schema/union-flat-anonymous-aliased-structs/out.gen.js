import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readPerson(bc) {
    return {
        tag: "Person",
        name: bare.readString(bc),
    }
}

export function writePerson(bc, x) {
    bare.writeString(bc, x.name)
}

export function readEntity(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return readPerson(bc)
        case 1:
            return {
                tag: 1,
                name: bare.readString(bc),
            }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeEntity(bc, x) {
    switch (x.tag) {
        case "Person": {
            bare.writeU8(bc, 0)
            writePerson(bc, x)
            break
        }
        case 1: {
            bare.writeU8(bc, 1)
            {
                bare.writeString(bc, x.name)
            }
            break
        }
    }
}

export function encodeEntity(x, config = DEFAULT_CONFIG) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeEntity(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeEntity(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readEntity(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
