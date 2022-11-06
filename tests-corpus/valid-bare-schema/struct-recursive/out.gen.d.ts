import * as bare from "@bare-ts/lib"

export type Node = {
    readonly children: readonly Node[]
}

export function readNode(bc: bare.ByteCursor): Node

export function writeNode(bc: bare.ByteCursor, x: Node): void
