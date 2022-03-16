import * as bare from "@bare-ts/lib"

export function readMultiArray(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [read0(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read0(bc)
    }
    return result
}

export function writeMultiArray(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        write0(bc, x[i])
    }
}

function read0(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [read1(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read1(bc)
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        write1(bc, x[i])
    }
}

function read1(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [bare.readString(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = bare.readString(bc)
    }
    return result
}

function write1(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        bare.writeString(bc, x[i])
    }
}
