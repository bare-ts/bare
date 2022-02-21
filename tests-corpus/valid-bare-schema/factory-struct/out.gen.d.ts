import * as bare from "@bare-ts/lib"
import * as ext from "./ext.js"

export type Person = ReturnType<typeof ext.Person>

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
