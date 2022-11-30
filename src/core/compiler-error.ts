//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

export class CompilerError extends Error {
    readonly location: Location | null

    constructor(issue: string, loc: Location | null) {
        super(`${locationRpr(loc)}${issue}`)
        this.name = "CompilerError"
        this.location = loc
    }
}

function locationRpr(loc: Location | null): string {
    return loc !== null ? `(${loc.filename}:${loc.line}:${loc.col}) ` : ""
}

export type Location = {
    readonly filename: string | number
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
