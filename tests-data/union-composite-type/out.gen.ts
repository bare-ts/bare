import assert from "assert"
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

export type Composite = 
    | { readonly tag: 0; readonly val: ReadonlyMap<string, string | undefined> }
    | { readonly tag: 1; readonly val: readonly (string | undefined)[] }
    | { readonly tag: 2; readonly val: Uint8Array }

export function decodeComposite(bc: bare.ByteCursor): Composite {
    const offset = bc.offset
    const tag = bare.decodeU8(bc)
    switch (tag) {
        case 0: {
            const val = (decode0)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (decode1)(bc)
            return { tag, val }
        }
        case 2: {
            const val = (decode2)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function encodeComposite(bc: bare.ByteCursor, x: Composite): void {
    const tag = x.tag;
    bare.encodeU8(bc, tag)
    switch (tag) {
        case 0:
            (encode0)(bc, x.val)
            break
        case 1:
            (encode1)(bc, x.val)
            break
        case 2:
            (encode2)(bc, x.val)
            break
    }
}

function decode0(bc: bare.ByteCursor): ReadonlyMap<string, string | undefined> {
    const len = bare.decodeUintSafe(bc)
    const result = new Map<string, string | undefined>()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.decodeString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (decode3)(bc))
    }
    return result
}

function encode0(bc: bare.ByteCursor, x: ReadonlyMap<string, string | undefined>): void {
    bare.encodeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.encodeString)(bc, kv[0]);
        (encode3)(bc, kv[1])
    }
}

function decode1(bc: bare.ByteCursor): readonly (string | undefined)[] {
    const len = 4
    const valDecoder = decode4
    const result = [valDecoder(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valDecoder(bc)
    }
    return result
}

function encode1(bc: bare.ByteCursor, x: readonly (string | undefined)[]): void {
    assert(x.length === 4, "Unmatched length")
    for (let i = 1; i < x.length; i++) {
        (encode4)(bc, x[i])
    }
}

function decode2(bc: bare.ByteCursor): Uint8Array {
    return bare.decodeU8FixedArray(bc, 4)
}

function encode2(bc: bare.ByteCursor, x: Uint8Array): void {
    return bare.encodeU8FixedArray(bc, x, 4)
}

function decode3(bc: bare.ByteCursor): string | undefined {
    return bare.decodeBool(bc)
        ? (bare.decodeString)(bc)
        : undefined
}

function encode3(bc: bare.ByteCursor, x: string | undefined): void {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (bare.encodeString)(bc, x)
    }
}

function decode4(bc: bare.ByteCursor): string | undefined {
    return bare.decodeBool(bc)
        ? (bare.decodeString)(bc)
        : undefined
}

function encode4(bc: bare.ByteCursor, x: string | undefined): void {
    bare.encodeBool(bc, x != null)
    if (x != null) {
        (bare.encodeString)(bc, x)
    }
}
