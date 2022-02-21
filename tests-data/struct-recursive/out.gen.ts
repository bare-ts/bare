import * as bare from "@bare-ts/lib"

export interface Node {
    readonly children: readonly (Node)[] | null
}

export function readNode(bc: bare.ByteCursor): Node {
    const children = (read0)(bc)
    return {
        children,
    }
}

export function writeNode(bc: bare.ByteCursor, x: Node): void {
    (write0)(bc, x.children);
}

function read0(bc: bare.ByteCursor): readonly (Node)[] | null {
    return bare.readBool(bc)
        ? (read1)(bc)
        : null
}

function write0(bc: bare.ByteCursor, x: readonly (Node)[] | null): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (write1)(bc, x)
    }
}

function read1(bc: bare.ByteCursor): readonly (Node)[] {
    const len = bare.readUintSafe(bc)
    if (len === 0) return []
    const valReader = readNode
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write1(bc: bare.ByteCursor, x: readonly (Node)[]): void {
    bare.writeUintSafe(bc, x.length)
    for (let i = 0; i < x.length; i++) {
        (writeNode)(bc, x[i])
    }
}
