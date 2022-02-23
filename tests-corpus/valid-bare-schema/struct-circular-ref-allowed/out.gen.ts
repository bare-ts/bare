import * as bare from "@bare-ts/lib"

export interface Person {
    readonly bestFriend: Person | null
    readonly secondBestFriend: 
        | { readonly tag: 0; readonly val: Person }
        | { readonly tag: 1; readonly val: null }
    readonly friends: readonly (Person)[]
    readonly friendNicknames: ReadonlyMap<string, Person>
}

export function readPerson(bc: bare.ByteCursor): Person {
    const bestFriend = (read0)(bc)
    const secondBestFriend = (read1)(bc)
    const friends = (read2)(bc)
    const friendNicknames = (read3)(bc)
    return {
        bestFriend,
        secondBestFriend,
        friends,
        friendNicknames,
    }
}

export function writePerson(bc: bare.ByteCursor, x: Person): void {
    (write0)(bc, x.bestFriend);
    (write1)(bc, x.secondBestFriend);
    (write2)(bc, x.friends);
    (write3)(bc, x.friendNicknames);
}

function read0(bc: bare.ByteCursor): Person | null {
    return bare.readBool(bc)
        ? (readPerson)(bc)
        : null
}

function write0(bc: bare.ByteCursor, x: Person | null): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (writePerson)(bc, x)
    }
}

function read1(bc: bare.ByteCursor): 
    | { readonly tag: 0; readonly val: Person }
    | { readonly tag: 1; readonly val: null } {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: (readPerson)(bc) }
        case 1:
            return { tag, val: null }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

function write1(bc: bare.ByteCursor, x: 
    | { readonly tag: 0; readonly val: Person }
    | { readonly tag: 1; readonly val: null }): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (writePerson)(bc, x.val)
            break
    }
}

function read2(bc: bare.ByteCursor): readonly (Person)[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = readPerson
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write2(bc: bare.ByteCursor, x: readonly (Person)[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (writePerson)(bc, x[i])
    }
}

function read3(bc: bare.ByteCursor): ReadonlyMap<string, Person> {
    const len = bare.readUintSafe(bc)
    const result = new Map<string, Person>()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.readString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (readPerson)(bc))
    }
    return result
}

function write3(bc: bare.ByteCursor, x: ReadonlyMap<string, Person>): void {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (writePerson)(bc, kv[1])
    }
}
