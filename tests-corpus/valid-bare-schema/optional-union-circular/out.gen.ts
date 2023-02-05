import * as bare from "@bare-ts/lib"

function read0(bc: bare.ByteCursor): 
    | { readonly tag: "Alias", readonly val: Alias }
    | { readonly tag: 1, readonly val: string } {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag: "Alias", val: readAlias(bc) }
        case 1:
            return { tag, val: bare.readString(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

function write0(bc: bare.ByteCursor, x: 
    | { readonly tag: "Alias", readonly val: Alias }
    | { readonly tag: 1, readonly val: string }): void {
    switch (x.tag) {
        case "Alias": {
            bare.writeU8(bc, 0)
            writeAlias(bc, x.val)
            break
        }
        case 1: {
            bare.writeString(bc, x.val)
            break
        }
    }
}

export type Alias =
    | { readonly tag: "Alias", readonly val: Alias }
    | { readonly tag: 1, readonly val: string } | null

export function readAlias(bc: bare.ByteCursor): Alias {
    return bare.readBool(bc)
        ? read0(bc)
        : null
}

export function writeAlias(bc: bare.ByteCursor, x: Alias): void {
    bare.writeBool(bc, x !== null)
    if (x !== null) {
        write0(bc, x)
    }
}
