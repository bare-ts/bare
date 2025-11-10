import * as bare from "@bare-ts/lib"

export type u8 = number

export type FieldNameCases = {
    readonly strictSnakeCase: u8
    readonly strictCamelCase: u8
    readonly snakeCase: u8
    readonly camelcase: u8
}

export function readFieldNameCases(bc: bare.ByteCursor): FieldNameCases {
    return {
        strictSnakeCase: bare.readU8(bc),
        strictCamelCase: bare.readU8(bc),
        snakeCase: bare.readU8(bc),
        camelcase: bare.readU8(bc),
    }
}

export function writeFieldNameCases(bc: bare.ByteCursor, x: FieldNameCases): void {
    bare.writeU8(bc, x.strictSnakeCase)
    bare.writeU8(bc, x.strictCamelCase)
    bare.writeU8(bc, x.snakeCase)
    bare.writeU8(bc, x.camelcase)
}

export function encodeFieldNameCases(x: FieldNameCases, config?: Partial<bare.Config>): Uint8Array {
    const fullConfig = config != null ? bare.Config(config) : bare.DEFAULT_CONFIG
    const bc = new bare.ByteCursor(
        new Uint8Array(fullConfig.initialBufferLength),
        fullConfig
    )
    writeFieldNameCases(bc, x)
    return new Uint8Array(bc.view.buffer, bc.view.byteOffset, bc.offset)
}

export function decodeFieldNameCases(bytes: Uint8Array): FieldNameCases {
    const bc = new bare.ByteCursor(bytes, bare.DEFAULT_CONFIG)
    const result = readFieldNameCases(bc)
    if (bc.offset < bc.view.byteLength) {
        throw new bare.BareError(bc.offset, "remaining bytes")
    }
    return result
}
