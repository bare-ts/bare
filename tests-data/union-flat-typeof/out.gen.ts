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

export type TypeOfUnion = 
    | boolean
    | u32
    | string
    | undefined

export function readTypeOfUnion(bc: bare.ByteCursor): TypeOfUnion {
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

export function writeTypeOfUnion(bc: bare.ByteCursor, x: TypeOfUnion): void {
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
