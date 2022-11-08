import * as bare from "@bare-ts/lib"

function read0(bc: bare.ByteCursor): Alias | null {
    return bare.readBool(bc)
        ? readAlias(bc)
        : null
}

function write0(bc: bare.ByteCursor, x: Alias | null): void {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        writeAlias(bc, x)
    }
}

export type Alias =
    | { readonly tag: 0, readonly val: Alias | null }
    | { readonly tag: 1, readonly val: string }

export function readAlias(bc: bare.ByteCursor): Alias {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: read0(bc) }
        case 1:
            return { tag, val: bare.readString(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeAlias(bc: bare.ByteCursor, x: Alias): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0: {
            write0(bc, x.val)
            break
        }
        case 1: {
            bare.writeString(bc, x.val)
            break
        }
    }
}
