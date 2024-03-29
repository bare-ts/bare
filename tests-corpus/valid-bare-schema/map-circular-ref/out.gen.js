import * as bare from "@bare-ts/lib"

export function readAlias(bc) {
    const len = bare.readUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = bare.readString(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, readAlias(bc))
    }
    return result
}

export function writeAlias(bc, x) {
    bare.writeUintSafe(bc, x.size)
    for (const kv of x) {
        bare.writeString(bc, kv[0])
        writeAlias(bc, kv[1])
    }
}
