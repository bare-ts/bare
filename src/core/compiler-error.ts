//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

/**
 * @sealed
 */
export class CompilerError extends Error {
    override name = "CompilerError"

    readonly location: Location | null

    constructor(issue: string, loc: Location | null) {
        super(`${locationRpr(loc)}${issue}`)
        this.location = loc
    }
}

function locationRpr(loc: Location | null): string {
    return loc !== null ? `(${loc.filename ?? ""}:${loc.line}:${loc.col}) ` : ""
}

export type Location = {
    readonly filename: string | number | null
    /**
     * 0-based index
     */
    readonly offset: number
    /**
     * 1-based line number
     */
    readonly line: number
    /**
     * 1-based  column number
     */
    readonly col: number
}
