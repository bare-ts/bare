import * as bare from "@bare-ts/lib"

export function readAlias(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [readAlias(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = readAlias(bc)
    }
    return result
}

export function writeAlias(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        writeAlias(bc, x[i])
    }
}
