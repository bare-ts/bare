import * as bare from "@bare-ts/lib"


export function readU8Array(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = bare.readU8
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeU8Array(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.writeU8)(bc, x[i])
    }
}
