import * as bare from "@bare-ts/lib"

export type Dict = Map<string, string>

export function readDict(bc: bare.ByteCursor): Dict

export function writeDict(bc: bare.ByteCursor, x: Dict): void
