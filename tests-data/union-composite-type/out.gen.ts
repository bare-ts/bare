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

export function readComposite(bc: bare.ByteCursor): Composite {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0: {
            const val = (read0)(bc)
            return { tag, val }
        }
        case 1: {
            const val = (read1)(bc)
            return { tag, val }
        }
        case 2: {
            const val = (read2)(bc)
            return { tag, val }
        }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeComposite(bc: bare.ByteCursor, x: Composite): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            (write0)(bc, x.val)
            break
        case 1:
            (write1)(bc, x.val)
            break
        case 2:
            (write2)(bc, x.val)
            break
    }
}

function read0(bc: bare.ByteCursor): ReadonlyMap<string, string | undefined> {
    const len = bare.readUintSafe(bc)
    const result = new Map<string, string | undefined>()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.readString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (read3)(bc))
    }
    return result
}

function write0(bc: bare.ByteCursor, x: ReadonlyMap<string, string | undefined>): void {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (write3)(bc, kv[1])
    }
}

function read1(bc: bare.ByteCursor): readonly (string | undefined)[] {
    const len = 4
    const valReader = read4
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write1(bc: bare.ByteCursor, x: readonly (string | undefined)[]): void {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        (write4)(bc, x[i])
    }
}

function read2(bc: bare.ByteCursor): Uint8Array {
    return bare.readU8FixedArray(bc, 4)
}

function write2(bc: bare.ByteCursor, x: Uint8Array): void {
    assert(x.length === 4)
    return bare.writeU8FixedArray(bc, x)
}

function read3(bc: bare.ByteCursor): string | undefined {
    return bare.readBool(bc)
        ? (bare.readString)(bc)
        : undefined
}

function write3(bc: bare.ByteCursor, x: string | undefined): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (bare.writeString)(bc, x)
    }
}

function read4(bc: bare.ByteCursor): string | undefined {
    return bare.readBool(bc)
        ? (bare.readString)(bc)
        : undefined
}

function write4(bc: bare.ByteCursor, x: string | undefined): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (bare.writeString)(bc, x)
    }
}
