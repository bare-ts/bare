import assert from "assert"
import * as bare from "@bare-ts/lib"

export type Composite = 
    | { readonly tag: 0; readonly val: ReadonlyMap<string, string | null> }
    | { readonly tag: 1; readonly val: readonly (string | null)[] }
    | { readonly tag: 2; readonly val: Uint8Array }

export function readComposite(bc: bare.ByteCursor): Composite {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: (read0)(bc) }
        case 1:
            return { tag, val: (read1)(bc) }
        case 2:
            return { tag, val: (read2)(bc) }
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

function read0(bc: bare.ByteCursor): ReadonlyMap<string, string | null> {
    const len = bare.readUintSafe(bc)
    const result = new Map<string, string | null>()
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

function write0(bc: bare.ByteCursor, x: ReadonlyMap<string, string | null>): void {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (write3)(bc, kv[1])
    }
}

function read1(bc: bare.ByteCursor): readonly (string | null)[] {
    const len = 4
    const valReader = read3
    const result = [valReader(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = valReader(bc)
    }
    return result
}

function write1(bc: bare.ByteCursor, x: readonly (string | null)[]): void {
    assert(x.length === 4, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        (write3)(bc, x[i])
    }
}

function read2(bc: bare.ByteCursor): Uint8Array {
    return bare.readU8FixedArray(bc, 4)
}

function write2(bc: bare.ByteCursor, x: Uint8Array): void {
    assert(x.length === 4)
    return bare.writeU8FixedArray(bc, x)
}

function read3(bc: bare.ByteCursor): string | null {
    return bare.readBool(bc)
        ? (bare.readString)(bc)
        : null
}

function write3(bc: bare.ByteCursor, x: string | null): void {
    bare.writeBool(bc, x != null)
    if (x != null) {
        (bare.writeString)(bc, x)
    }
}
