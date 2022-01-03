import type { Location } from "./lex.js"

export class BareParserError extends Error {
    declare readonly name: "BareParserError"

    declare readonly location: Location

    constructor(issue: string, location: Location) {
        super(
            `(${location.filename}:${location.line}:${location.col}) ${issue}`
        )
        this.name = "BareParserError"
        this.location = location
    }
}
