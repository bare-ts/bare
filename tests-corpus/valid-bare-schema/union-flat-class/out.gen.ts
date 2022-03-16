import * as bare from "@bare-ts/lib"

export type u32 = number

export class BoxedU32 {
    readonly val: u32
    constructor(
        val: u32,
    ) {
        this.val = val
    }
}

export function readBoxedU32(bc: bare.ByteCursor): BoxedU32 {
    return new BoxedU32(
        bare.readU32(bc))
}

export function writeBoxedU32(bc: bare.ByteCursor, x: BoxedU32): void {
    bare.writeU32(bc, x.val)
}

export class BoxedString {
    readonly val: string
    constructor(
        val: string,
    ) {
        this.val = val
    }
}

export function readBoxedString(bc: bare.ByteCursor): BoxedString {
    return new BoxedString(
        bare.readString(bc))
}

export function writeBoxedString(bc: bare.ByteCursor, x: BoxedString): void {
    bare.writeString(bc, x.val)
}

export type Boxed = 
    | BoxedU32
    | BoxedString

export function readBoxed(bc: bare.ByteCursor): Boxed {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return readBoxedU32(bc)
        case 1:
            return readBoxedString(bc)
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeBoxed(bc: bare.ByteCursor, x: Boxed): void {
    if (x instanceof BoxedU32) {
            bare.writeU8(bc, 0)
            writeBoxedU32(bc, x)
        } else if (x instanceof BoxedString) {
            bare.writeU8(bc, 1)
            writeBoxedString(bc, x)
        }
}
