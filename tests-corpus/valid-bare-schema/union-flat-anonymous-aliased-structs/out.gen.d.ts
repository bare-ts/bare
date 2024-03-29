import * as bare from "@bare-ts/lib"

export type Person = {
    readonly tag: "Person"
    readonly name: string
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void

export type Entity =
    | Person
    /**
     * Anonymous entity
     */
    | {
        readonly tag: 1
        readonly name: string
    }

export function readEntity(bc: bare.ByteCursor): Entity

export function writeEntity(bc: bare.ByteCursor, x: Entity): void

export function encodeEntity(x: Entity, config?: Partial<bare.Config>): Uint8Array

export function decodeEntity(bytes: Uint8Array): Entity
