import * as bare from "@bare-ts/lib"

export declare class Operation {
    readonly await: string
    readonly class: string
    readonly extends: string
    readonly typeof: string
    readonly for: string
    constructor(
        await_: string,
        class_: string,
        extends_: string,
        typeof_: string,
        for_: string,
    )
}

export function readOperation(bc: bare.ByteCursor): Operation

export function writeOperation(bc: bare.ByteCursor, x: Operation): void

export function encodeOperation(x: Operation): Uint8Array

export function decodeOperation(bytes: Uint8Array): Operation
