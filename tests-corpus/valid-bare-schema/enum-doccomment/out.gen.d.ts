import * as bare from "@bare-ts/lib"

/**
 * An enum to model Genders
 */
export declare enum Gender {
    /**
     * Be inclusive :)
     */
    Fluid = "Fluid",
    Male = "Male",
    /**
     * One is not born, but becomes a woman
     *                  -- Simone de Beauvoir
     */
    Female = "Female",
}

export function readGender(bc: bare.ByteCursor): Gender

export function writeGender(bc: bare.ByteCursor, x: Gender): void

export function encodeGender(x: Gender, config?: Partial<bare.Config>): Uint8Array

export function decodeGender(bytes: Uint8Array): Gender
