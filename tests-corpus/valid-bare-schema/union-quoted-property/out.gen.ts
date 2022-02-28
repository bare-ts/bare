import * as bare from "@bare-ts/lib"

export type u8 = number
export type u16 = number
export type u32 = number
export type u64 = bigint
export type uint = bigint

export type UnsignedInt = 
    | { readonly "tag": 0; readonly "val": u8 }
    | { readonly "tag": 1; readonly "val": u16 }
    | { readonly "tag": 2; readonly "val": u32 }
    | { readonly "tag": 3; readonly "val": u64 }
    | { readonly "tag": 4; readonly "val": uint }

export function readUnsignedInt(bc: bare.ByteCursor): UnsignedInt {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { "tag": tag, "val": (bare.readU8)(bc) }
        case 1:
            return { "tag": tag, "val": (bare.readU16)(bc) }
        case 2:
            return { "tag": tag, "val": (bare.readU32)(bc) }
        case 3:
            return { "tag": tag, "val": (bare.readU64)(bc) }
        case 4:
            return { "tag": tag, "val": (bare.readUint)(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeUnsignedInt(bc: bare.ByteCursor, x: UnsignedInt): void {
    bare.writeU8(bc, x.tag)
    switch (x["tag"]) {
        case 0:
            (bare.writeU8)(bc, x["val"])
            break
        case 1:
            (bare.writeU16)(bc, x["val"])
            break
        case 2:
            (bare.writeU32)(bc, x["val"])
            break
        case 3:
            (bare.writeU64)(bc, x["val"])
            break
        case 4:
            (bare.writeUint)(bc, x["val"])
            break
    }
}
