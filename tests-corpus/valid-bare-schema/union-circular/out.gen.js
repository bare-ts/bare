import * as bare from "@bare-ts/lib"

export function readAlias(bc) {
    const offset = bc.offset
    const tag = bare.readU8(bc)
    switch (tag) {
        case 0:
            return { tag: "Alias1", val: readAlias1(bc) }
        case 1:
            return { tag: "Alias2", val: readAlias2(bc) }
        default: {
            bc.offset = offset
            throw new bare.BareError(offset, "invalid tag")
        }
    }
}

export function writeAlias(bc, x) {
    switch (x.tag) {
        case "Alias1": {
            bare.writeU8(bc, 0)
            writeAlias1(bc, x.val)
            break
        }
        case "Alias2": {
            bare.writeU8(bc, 1)
            writeAlias2(bc, x.val)
            break
        }
    }
}

export function readAlias1(bc) {
    return readAlias(bc)
}

export function writeAlias1(bc, x) {
    writeAlias(bc, x)
}

export function readAlias2(bc) {
    return bare.readU8(bc)
}

export function writeAlias2(bc, x) {
    bare.writeU8(bc, x)
}
