import * as bare from "@bare-ts/lib"

export type u8 = number

export type Alias =
    | { readonly tag: 0, readonly val: Alias1 }
    | { readonly tag: 1, readonly val: Alias2 }

export function readAlias(bc: bare.ByteCursor): Alias {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: readAlias1(bc) }
        case 1:
            return { tag, val: readAlias2(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeAlias(bc: bare.ByteCursor, x: Alias): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            writeAlias1(bc, x.val)
            break
        case 1:
            writeAlias2(bc, x.val)
            break
    }
}

export type Alias1 = Alias

export function readAlias1(bc: bare.ByteCursor): Alias1 {
    return readAlias(bc)
}

export function writeAlias1(bc: bare.ByteCursor, x: Alias1): void {
    writeAlias(bc, x)
}

export type Alias2 = u8

export function readAlias2(bc: bare.ByteCursor): Alias2 {
    return bare.readU8(bc)
}

export function writeAlias2(bc: bare.ByteCursor, x: Alias2): void {
    bare.writeU8(bc, x)
}
