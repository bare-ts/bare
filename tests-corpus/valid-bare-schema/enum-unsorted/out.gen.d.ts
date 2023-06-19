import * as bare from "@bare-ts/lib"

export declare enum Gender {
    Fluid = "Fluid",
    Male = "Male",
    Female = "Female",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export function encodeGender(x: Gender, config?: Partial<bare.Config>): Uint8Array

export function decodeGender(bytes: Uint8Array): Gender
