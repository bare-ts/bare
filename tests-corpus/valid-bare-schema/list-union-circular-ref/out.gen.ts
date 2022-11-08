import assert from "assert"
import * as bare from "@bare-ts/lib"

function read0(bc: bare.ByteCursor): 
    | { readonly tag: 0, readonly val: Alias }
    | { readonly tag: 1, readonly val: string } {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readAlias(bc) }
        case 1:
            return { tag, val: bare.readString(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

function write0(bc: bare.ByteCursor, x: 
    | { readonly tag: 0, readonly val: Alias }
    | { readonly tag: 1, readonly val: string }): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0: {
            writeAlias(bc, x.val)
            break
        }
        case 1: {
            bare.writeString(bc, x.val)
            break
        }
    }
}

export type Alias = readonly (
    | { readonly tag: 0, readonly val: Alias }
    | { readonly tag: 1, readonly val: string })[]

export function readAlias(bc: bare.ByteCursor): Alias {
    const len = 2
    const result = [read0(bc)]
    for (let i = 1; i < len; i++) {
        result[i] = read0(bc)
    }
    return result
}

export function writeAlias(bc: bare.ByteCursor, x: Alias): void {
    assert(x.length === 2, "Unmatched length")
    for (let i = 0; i < x.length; i++) {
        write0(bc, x[i])
    }
}
