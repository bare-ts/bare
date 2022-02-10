import * as bare from "@bare-ts/lib"

export type Dict = Map<string, string>

export function readDict(bc: bare.ByteCursor): Dict {
    const len = bare.readUintSafe(bc)
    const result = new Map<string, string>()
    for (let i = 0; i < len; i++) {
        const offset = bc.offset
        const key = (bare.readString)(bc)
        if (result.has(key)) {
            bc.offset = offset
            throw new bare.BareError(offset, "duplicated key")
        }
        result.set(key, (bare.readString)(bc))
    }
    return result
}

export function writeDict(bc: bare.ByteCursor, x: Dict): void {
    bare.writeUintSafe(bc, x.size)
    for(const kv of x) {
        (bare.writeString)(bc, kv[0]);
        (bare.writeString)(bc, kv[1])
    }
}
