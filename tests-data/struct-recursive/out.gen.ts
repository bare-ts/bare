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

export function decodeNode(bc: bare.ByteCursor): Node {
    const children = (decode0)(bc)
    return {
        children,
    }
}

export function encodeNode(bc: bare.ByteCursor, x: Node): void {
    (encode0)(bc, x.children);
}

function decode0(bc: bare.ByteCursor): readonly (Node)[] | undefined {
    return bare.decodeBool(bc)
        ? (decode1)(bc)
        : undefined
}

function encode0(bc: bare.ByteCursor, x: readonly (Node)[] | undefined): void {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (encode1)(bc, x)
    }
}

function decode1(bc: bare.ByteCursor): readonly (Node)[] {
    const len = bare.decodeUintSafe(bc)
    if (len === 0) return []
    const valDecoder = decodeNode
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode1(bc: bare.ByteCursor, x: readonly (Node)[]): void {
    bare.encodeUintSafe(bc, x.length)
    for (let i = 1; i < x.length; i++) {
        (encodeNode)(bc, x[i])
    }
}
