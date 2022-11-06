import * as bare from "@bare-ts/lib"

export type Person = {
    readonly bestFriend: Person | null
    readonly secondBestFriend: 
        | { readonly tag: 0; readonly val: Person }
        | { readonly tag: 1; readonly val: null }
    readonly friends: readonly Person[]
    readonly friendNicknames: ReadonlyMap<string, Person>
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
