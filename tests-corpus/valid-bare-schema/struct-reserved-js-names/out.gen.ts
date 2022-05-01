import * as bare from "@bare-ts/lib"

export class Operation {
    readonly await: string
    readonly class: string
    readonly extends: string
    readonly typeof: string
    readonly for: string
    constructor(
        await_: string,
        class_: string,
        extends_: string,
        typeof_: string,
        for_: string,
    ) {
        this.await = await_
        this.class = class_
        this.extends = extends_
        this.typeof = typeof_
        this.for = for_
    }
}

export function readOperation(bc: bare.ByteCursor): Operation {
    return new Operation(
        bare.readString(bc),
        bare.readString(bc),
        bare.readString(bc),
        bare.readString(bc),
        bare.readString(bc))
}

export function writeOperation(bc: bare.ByteCursor, x: Operation): void {
    bare.writeString(bc, x.await)
    bare.writeString(bc, x.class)
    bare.writeString(bc, x.extends)
    bare.writeString(bc, x.typeof)
    bare.writeString(bc, x.for)
}
