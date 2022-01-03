import * as bare from "@bare-ts/lib"


export function decodeDict(bc) {
    const len = bare.decodeUintSafe(bc)
    const result = new Map()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.decodeString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (bare.decodeString)(bc))
    }
    return result
}

export function encodeDict(bc, x) {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (bare.encodeString)(bc, kv[1])
    }
}
