import * as bare from "@bare-ts/lib"

export declare enum Gender {
    FLUID = "FLUID",
    MALE = "MALE",
    FEMALE = "FEMALE",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export function encodeGender(x: Gender): Uint8Array

export function decodeGender(bytes: Uint8Array): Gender
