import * as bare from "@bare-ts/lib"

const config = /* @__PURE__ */ bare.Config({})

export class Operation {
    constructor(
        await_,
        class_,
        extends_,
        typeof_,
        for_,
    ) {
        this.await = await_
        this.class = class_
        this.extends = extends_
        this.typeof = typeof_
        this.for = for_
    }
}

export function readOperation(bc) {
    return new Operation(
        bare.readString(bc),
        bare.readString(bc),
        bare.readString(bc),
        bare.readString(bc),
        bare.readString(bc))
}

export function writeOperation(bc, x) {
    bare.writeString(bc, x.await)
    bare.writeString(bc, x.class)
    bare.writeString(bc, x.extends)
    bare.writeString(bc, x.typeof)
    bare.writeString(bc, x.for)
}

export function encodeOperation(x) {
    const bc = new bare.ByteCursor(
        new Uint8Array(config.initialBufferLength),
        config
    )
    writeOperation(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeOperation(bytes) {
    const bc = new bare.ByteCursor(bytes, config)
    const result = readOperation(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
