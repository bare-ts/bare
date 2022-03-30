import * as bare from "@bare-ts/lib"

export type MultiList = readonly (readonly (readonly string[])[])[]

export function readMultiList(bc: bare.ByteCursor): MultiList {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [read0(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read0(bc)
    }
    return result
}

export function writeMultiList(bc: bare.ByteCursor, x: MultiList): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        write0(bc, x[i])
    }
}

function read0(bc: bare.ByteCursor): readonly (readonly string[])[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [read1(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read1(bc)
    }
    return result
}

function write0(bc: bare.ByteCursor, x: readonly (readonly string[])[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        write1(bc, x[i])
    }
}

function read1(bc: bare.ByteCursor): readonly string[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readString(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readString(bc)
    }
    return result
}

function write1(bc: bare.ByteCursor, x: readonly string[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeString(bc, x[i])
    }
}