import * as bare from "@bare-ts/lib"

export type u8 = number

export type LeadingPipe =
    | { readonly tag: 0; readonly val: u8 }

export function readLeadingPipe(bc: bare.ByteCursor): LeadingPipe

export function writeLeadingPipe(bc: bare.ByteCursor, x: LeadingPipe): void

export function encodeLeadingPipe(x: LeadingPipe): Uint8Array

export function decodeLeadingPipe(bytes: Uint8Array): LeadingPipe

export type TrailingPipe =
    | { readonly tag: 0; readonly val: u8 }

export function readTrailingPipe(bc: bare.ByteCursor): TrailingPipe

export function writeTrailingPipe(bc: bare.ByteCursor, x: TrailingPipe): void

export function encodeTrailingPipe(x: TrailingPipe): Uint8Array

export function decodeTrailingPipe(bytes: Uint8Array): TrailingPipe
