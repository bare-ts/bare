import * as bare from "@bare-ts/lib"

export type u8 = number

export type LeadingPipe =
    | { readonly tag: 0; readonly val: u8 }

export function readLeadingPipe(bc: bare.ByteCursor): LeadingPipe {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeLeadingPipe(bc: bare.ByteCursor, x: LeadingPipe): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}

export type TrailingPipe =
    | { readonly tag: 0; readonly val: u8 }

export function readTrailingPipe(bc: bare.ByteCursor): TrailingPipe {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag, val: bare.readU8(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeTrailingPipe(bc: bare.ByteCursor, x: TrailingPipe): void {
    bare.writeU8(bc, x.tag)
    switch (x.tag) {
        case 0:
            bare.writeU8(bc, x.val)
            break
    }
}
