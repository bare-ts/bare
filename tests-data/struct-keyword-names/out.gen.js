import * as bare from "@bare-ts/lib"


export function decodeOperation(bc) {
    const type = (bare.decodeString)(bc)
    const struct = (bare.decodeString)(bc)
    const _enum = (bare.decodeString)(bc)
    const _const = (bare.decodeBool)(bc)
    const _bc = (bare.decodeU8)(bc)
    return {
        type,
        struct,
        enum: _enum,
        const: _const,
        bc: _bc,
    }
}

export function encodeOperation(bc, x) {
    (bare.encodeString)(bc, x.type);
    (bare.encodeString)(bc, x.struct);
    (bare.encodeString)(bc, x.enum);
    (bare.encodeBool)(bc, x.const);
    (bare.encodeU8)(bc, x.bc);
}
