import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export type Person = {
    readonly tag: "Person"
    readonly name: string
}

export function readPerson(bc: bare.ByteCursor): Person {
    return {
        tag: "Person",
        name: bare.readString(bc),
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    bare.writeString(bc, x.name)
}

export type Entity =
    | Person
    | {
        readonly tag: 1
        readonly name: string
    }

export function readEntity(bc: bare.ByteCursor): Entity {
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

export function writeEntity(bc: bare.ByteCursor, x: Entity): void {
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

export function encodeEntity(x: Entity, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeEntity(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeEntity(bytes: Uint8Array): Entity {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readEntity(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
