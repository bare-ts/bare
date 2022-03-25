import * as bare from "@bare-ts/lib"

export function readData(bc) {
    return bare.readData(bc)
}

export function writeData(bc, x) {
    bare.writeData(bc, x)
}
