import * as bare from "@bare-ts/lib"

export function readU64Array(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readU64Safe(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU64Safe(bc)
    }
    return result
}

export function writeU64Array(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeU64Safe(bc, x[i])
    }
}
