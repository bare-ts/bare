import * as bare from "@bare-ts/lib"

export type u8 = number

export type LeadingPipe =
    | { readonly tag: 0; readonly val: u8 }

export function readLeadingPipe(bc: bare.ByteCursor): LeadingPipe

export function writeLeadingPipe(bc: bare.ByteCursor, x: LeadingPipe): void

export type TrailingPipe =
    | { readonly tag: 0; readonly val: u8 }

export function readTrailingPipe(bc: bare.ByteCursor): TrailingPipe

export function writeTrailingPipe(bc: bare.ByteCursor, x: TrailingPipe): void
