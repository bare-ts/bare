import * as bare from "@bare-ts/lib"

const DEFAULT_CONFIG = /* @__PURE__ */ bare.Config({})

export function readFieldNameCases(bc) {
    return {
        strictSnakeCase: bare.readU8(bc),
        strictCamelCase: bare.readU8(bc),
        snakeCase: bare.readU8(bc),
        camelcase: bare.readU8(bc),
    }
}

export function writeFieldNameCases(bc, x) {
    bare.writeU8(bc, x.strictSnakeCase)
    bare.writeU8(bc, x.strictCamelCase)
    bare.writeU8(bc, x.snakeCase)
    bare.writeU8(bc, x.camelcase)
}

export function encodeFieldNameCases(x, config) {
    const fullConfig = config != null ? bare.Config(config) : DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig,
    )
    writeFieldNameCases(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeFieldNameCases(bytes) {
    const bc = new bare.ByteCursor(bytes, DEFAULT_CONFIG)
    const result = readFieldNameCases(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
