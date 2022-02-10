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

export type Dict = ReadonlyMap<string, string>

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
