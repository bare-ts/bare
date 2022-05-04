import * as bare from "@bare-ts/lib"

export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    FLUID = "FLUID",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export function encodeGender(x: Gender): Uint8Array

export function decodeGender(bytes: Uint8Array): Gender
