import * as bare from "@bare-ts/lib"

export type f32 = number
export type f64 = number
export type i8 = number
export type i16 = number
export type i32 = number
export type i64 = bigint
export type i64Safe = number
export type int = bigint
export type intSafe = number
export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint
export type u64Safe = number
export type uint = bigint
export type uintSafe = number

export interface Node {
    readonly children: readonly (Node)[] | undefined
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

function read0(bc: bare.ByteCursor): readonly (Node)[] | undefined {
    return bare.readBool(bc)
        ? (read1)(bc)
        : undefined
}

function write0(bc: bare.ByteCursor, x: readonly (Node)[] | undefined): void {
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
