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

export type Composite = 
    | { readonly tag: 0; readonly val: ReadonlyMap<string, string | undefined> }
    | { readonly tag: 1; readonly val: readonly (string | undefined)[] }
    | { readonly tag: 2; readonly val: Uint8Array }

export function readComposite(bc: bare.ByteCursor): Composite

export function writeComposite(bc: bare.ByteCursor, x: Composite): void
