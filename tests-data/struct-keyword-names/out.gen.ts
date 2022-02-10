import * as bare from "@bare-ts/lib"

export type u8 = number

export interface Operation {
    readonly type: string
    readonly struct: string
    readonly enum: string
    readonly const: boolean
    readonly bc: u8
}

export function readOperation(bc: bare.ByteCursor): Operation {
    const type = (bare.readString)(bc)
    const struct = (bare.readString)(bc)
    const _enum = (bare.readString)(bc)
    const _const = (bare.readBool)(bc)
    const _bc = (bare.readU8)(bc)
    return {
        type,
        struct,
        enum: _enum,
        const: _const,
        bc: _bc,
    }
}

export function writeOperation(bc: bare.ByteCursor, x: Operation): void {
    (bare.writeString)(bc, x.type);
    (bare.writeString)(bc, x.struct);
    (bare.writeString)(bc, x.enum);
    (bare.writeBool)(bc, x.const);
    (bare.writeU8)(bc, x.bc);
}
