import * as bare from "@bare-ts/lib"

export type u8 = number

export type FieldNameCases = {
    readonly strictSnakeCase: u8
    readonly strictCamelCase: u8
    readonly snakeCase: u8
    readonly camelcase: u8
}

export function readFieldNameCases(bc: bare.ByteCursor): FieldNameCases

export function writeFieldNameCases(bc: bare.ByteCursor, x: FieldNameCases): void

export function encodeFieldNameCases(x: FieldNameCases, config?: Partial<bare.Config>): Uint8Array

export function decodeFieldNameCases(bytes: Uint8Array): FieldNameCases
