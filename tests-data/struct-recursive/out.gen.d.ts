import * as bare from "@bare-ts/lib"

export interface Node {
    readonly children: readonly (Node)[] | null
}

export function readNode(bc: bare.ByteCursor): Node

export function writeNode(bc: bare.ByteCursor, x: Node): void
