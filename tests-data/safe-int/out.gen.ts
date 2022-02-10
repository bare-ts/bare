import * as bare from "@bare-ts/lib"

export type i64Safe = number
export type u64Safe = number

export type I64 = i64Safe

export const readI64 = bare.readI64Safe

export const writeI64 = bare.writeI64Safe

export type U64 = u64Safe

export const readU64 = bare.readU64Safe

export const writeU64 = bare.writeU64Safe
