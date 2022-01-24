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

export enum Gender {
    MALE = 1,
    FEMALE,
    FLUID = 9007199254740991,
}

export function readGender(bc: bare.ByteCursor): Gender {
    const offset = bc.offset
    const tag = bare.readUintSafe(bc)
    switch (tag) {
        case 1:
            return Gender.MALE
        case 2:
            return Gender.FEMALE
        case 9007199254740991:
            return Gender.FLUID
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeGender(bc: bare.ByteCursor, x: Gender): void {
    bare.writeUintSafe(bc, x)
}
