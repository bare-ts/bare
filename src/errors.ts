//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

/**
 * @sealed
 */
export class CompilerError extends Error {
    override name = "CompilerError"

    readonly offset: number

    constructor(msg: string, offset: number) {
        super(msg)
        this.offset = offset
    }
}

/**
 * @sealed
 */
export class ConfigError extends Error {
    override name = "ConfigError"
}
