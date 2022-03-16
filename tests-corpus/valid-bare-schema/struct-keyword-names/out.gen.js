import * as bare from "@bare-ts/lib"

export function readOperation(bc) {
    return {
        type: bare.readString(bc),
        struct: bare.readString(bc),
        enum: bare.readString(bc),
        const: bare.readBool(bc),
        bc: bare.readU8(bc),
    }
}

export function writeOperation(bc, x) {
    bare.writeString(bc, x.type)
    bare.writeString(bc, x.struct)
    bare.writeString(bc, x.enum)
    bare.writeBool(bc, x.const)
    bare.writeU8(bc, x.bc)
}
