import * as bare from "@bare-ts/lib"

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
