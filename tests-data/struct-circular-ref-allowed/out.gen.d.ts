import * as bare from "@bare-ts/lib"

export interface Person {
    readonly bestFriend: Person | undefined
    readonly secondBestFriend: 
        | { readonly tag: 0; readonly val: Person }
        | { readonly tag: 1; readonly val: undefined }
    readonly friends: readonly (Person)[]
    readonly friendNicknames: ReadonlyMap<string, Person>
}

export function readPerson(bc: bare.ByteCursor): Person

export function writePerson(bc: bare.ByteCursor, x: Person): void
