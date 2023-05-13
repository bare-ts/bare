import * as bare from "@bare-ts/lib"

export type Alias = readonly Alias[]

export function readAlias(bc: bare.ByteCursor): Alias {
    const len = bare.readUintSafe(bc)
    if (len === 0) {
        return []
    }
    const result = [readAlias(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = readAlias(bc)
    }
    return result
}

export function writeAlias(bc: bare.ByteCursor, x: Alias): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        writeAlias(bc, x[i])
    }
}
