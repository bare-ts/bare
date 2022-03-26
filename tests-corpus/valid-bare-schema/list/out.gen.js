import * as bare from "@bare-ts/lib"

export function readU8List(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readU8(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readU8(bc)
    }
    return result
}

export function writeU8List(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeU8(bc, x[i])
    }
}
