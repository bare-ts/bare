import * as bare from "@bare-ts/lib"

export declare enum Gender {
    FLUID,
    MALE,
    FEMALE,
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void
