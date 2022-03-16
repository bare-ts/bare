import * as bare from "@bare-ts/lib"

export class BoxedU32 {
    constructor(
        val,
    ) {
        this.val = val
    }
}

export function readBoxedU32(bc) {
    return new BoxedU32(
        bare.readU32(bc))
}

export function writeBoxedU32(bc, x) {
    bare.writeU32(bc, x.val)
}

export class BoxedString {
    constructor(
        val,
    ) {
        this.val = val
    }
}

export function readBoxedString(bc) {
    return new BoxedString(
        bare.readString(bc))
}

export function writeBoxedString(bc, x) {
    bare.writeString(bc, x.val)
}

export function readBoxed(bc) {
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

export function writeBoxed(bc, x) {
    if (x instanceof BoxedU32) {
            bare.writeU8(bc, 0)
            writeBoxedU32(bc, x)
        } else if (x instanceof BoxedString) {
            bare.writeU8(bc, 1)
            writeBoxedString(bc, x)
        }
}
