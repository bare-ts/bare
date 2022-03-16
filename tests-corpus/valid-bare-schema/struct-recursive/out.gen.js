import * as bare from "@bare-ts/lib"

export function readNode(bc) {
    return {
        children: read0(bc),
    }
}

export function writeNode(bc, x) {
    write0(bc, x.children)
}

function read0(bc) {
    return bare.readBool(bc)
        ? read1(bc)
        : null
}

function write0(bc, x) {
    bare.writeBool(bc, x != null)
    if (x != null) {
        write1(bc, x)
    }
}

function read1(bc) {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const result = [readNode(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = readNode(bc)
    }
    return result
}

function write1(bc, x) {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        writeNode(bc, x[i])
    }
}
