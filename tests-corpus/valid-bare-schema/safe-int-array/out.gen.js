import * as bare from "@bare-ts/lib"

export function readU64Array(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = bare.readU64Safe
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeU64Array(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.writeU64Safe)(bc, x[i])
    }
}
