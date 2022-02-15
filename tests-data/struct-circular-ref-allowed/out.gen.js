import * as bare from "@bare-ts/lib"

export function readPerson(bc) {
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

export function writePerson(bc, x) {
    (write0)(bc, x.bestFriend);
    (write1)(bc, x.secondBestFriend);
    (write2)(bc, x.friends);
    (write3)(bc, x.friendNicknames);
}

function read0(bc) {
    return bare.readBool(bc)
        ? (readPerson)(bc)
        : undefined
}

function write0(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (writePerson)(bc, x)
    }
}

function read1(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (readPerson)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (bare.readVoid)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

function write1(bc, x) {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (writePerson)(bc, x.val)
            break
        case 1:
            (bare.writeVoid)(bc, x.val)
            break
    }
}

function read2(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = readPerson
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write2(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (writePerson)(bc, x[i])
    }
}

function read3(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
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

function write3(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (writePerson)(bc, kv[1])
    }
}
