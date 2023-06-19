import * as bare from "@bare-ts/lib"

export declare enum Gender {
    Fluid = "Fluid",
    Male = "Male",
    Female = "Female",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export type GenderNames = ReadonlyMap<Gender, string>

export function readGenderNames(bc: bare.ByteCursor): GenderNames

export function writeGenderNames(bc: bare.ByteCursor, x: GenderNames): void

export function encodeGenderNames(x: GenderNames, config?: Partial<bare.Config>): Uint8Array

export function decodeGenderNames(bytes: Uint8Array): GenderNames
