import * as bare from "@bare-ts/lib"

function read0(bc: bare.ByteCursor): readonly Node[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) { return [] }
    const result = [readNode(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = readNode(bc)
    }
    return result
}

function write0(bc: bare.ByteCursor, x: readonly Node[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        writeNode(bc, x[i])
    }
}

export type Node = {
    readonly children: readonly Node[],
}

export function readNode(bc: bare.ByteCursor): Node {
    return {
        children: read0(bc),
    }
}

export function writeNode(bc: bare.ByteCursor, x: Node): void {
    write0(bc, x.children)
}
