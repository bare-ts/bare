import * as bare from "@bare-ts/lib"

export function readMultiArray(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = read0
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

export function writeMultiArray(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (write0)(bc, x[i])
    }
}

function read0(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = read1
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write0(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (write1)(bc, x[i])
    }
}

function read1(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = bare.readString
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write1(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (bare.writeString)(bc, x[i])
    }
}
