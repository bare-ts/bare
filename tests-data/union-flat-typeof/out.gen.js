import * as bare from "@bare-ts/lib"


export function readTypeOfUnion(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return (bare.readBool)(bc)
        case 1:
            return (bare.readU32)(bc)
        case 2:
            return (bare.readString)(bc)
        case 3:
            return (bare.readVoid)(bc)
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeTypeOfUnion(bc, x) {
    switch (typeof x) {
        case "boolean":
            bare.writeU8(bc, 0);
            (bare.writeBool)(bc, x)
            break
        case "number":
            bare.writeU8(bc, 1);
            (bare.writeU32)(bc, x)
            break
        case "string":
            bare.writeU8(bc, 2);
            (bare.writeString)(bc, x)
            break
        default:
            bare.writeU8(bc, 3)
            break
    }
}
