import { BareParserError } from "./bare-parser-error.js"

export interface Location {
    readonly filename: string
    readonly offset: number
    readonly line: number
    readonly col: number
}

const WHITE_SPACE_PATTERN = /\s/
const PUNCTUATION_PATTERN = /[\{\}\[\]\(\)<>=\|:,;\.!?~+-\\/$@]/
const ID_PATTERN = /([A-Za-z0-9_]+)/

export class Lex {
    declare readonly filename: string
    private declare readonly content: string
    private declare offset: number
    private declare line: number
    private declare col: number
    private declare _token: string

    constructor(content: string, filename: string) {
        this.filename = filename
        this.content = content
        this.offset = 0
        this.line = 1
        this.col = 0
        this.forth()
    }

    token(): string {
        return this._token
    }

    location(): Location {
        const { filename, offset, line, col } = this
        return { filename, offset, line, col }
    }

    forth(): void {
        const content = this.content
        while (this.offset < content.length) {
            const c = content[this.offset]
            if (WHITE_SPACE_PATTERN.test(c)) {
                if (c === "\n") {
                    this.line++
                    this.col = 0
                } else {
                    this.col++
                }
                this.offset++
            } else if (c === "#") {
                // comment
                const len = content.indexOf("\n", this.offset + 1) - this.offset
                this.col += len
                this.offset += len
            } else {
                if (ID_PATTERN.test(c)) {
                    const suffix = content.slice(this.offset)
                    this._token = (
                        suffix.match(ID_PATTERN) as RegExpMatchArray
                    )[0]
                    this.offset += this._token.length
                    this.col += this._token.length
                    return
                } else if (PUNCTUATION_PATTERN.test(c)) {
                    this.offset++
                    this.col++
                    this._token = c
                    return
                } else {
                    throw new BareParserError(
                        `invalid character '${c}'`,
                        this.location()
                    )
                }
            }
        }
        this._token = ""
    }
}
