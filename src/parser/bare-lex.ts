//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { CompilerError, type Location } from "../core/compiler-error.js"

const WHITE_SPACE_PATTERN = /\s/
const PUNCTUATION_PATTERN = /[\{\}\[\]\(\)<>=\|:,;\.!?~+-\\/$@#]/
const ID_PATTERN = /([A-Za-z0-9_]+)/

export class Lex {
    readonly content: string
    readonly filename: string | number
    private offset: number
    private line: number
    private col: number
    private _docComment: string
    private _token: string

    constructor(content: string, filename: string | number) {
        this.content = content
        this.filename = filename
        this.offset = 0
        this.line = 1
        this.col = 1
        this._docComment = ""
        this._token = ""
        this.forth()
    }

    token(): string {
        return this._token
    }

    /**
     * @returns collected comment since the last comment' consumption.
     *  Null if no collected comment or empty comment.
     */
    consumeDocComment(): string | null {
        const comment = this._docComment
        if (comment !== "") {
            this._docComment = ""
            return comment
        }
        return null
    }

    location(): Location {
        let { filename, offset, line, col, _token } = this
        offset -= _token.length
        col -= _token.length
        return { filename, offset, line, col }
    }

    forth(): void {
        const content = this.content
        while (this.offset < content.length) {
            const c = content[this.offset]
            if (WHITE_SPACE_PATTERN.test(c)) {
                if (c === "\n") {
                    this.line++
                    this.col = 1
                } else {
                    this.col++
                }
                this.offset++
            } else if (c === "#") {
                // comment
                let index = content.indexOf("\n", this.offset + 1)
                if (index === -1) {
                    // EOF
                    index = content.length
                }
                if (
                    this.offset + 1 < content.length &&
                    content[this.offset + 1] === "#"
                ) {
                    this._docComment += content.slice(
                        this.offset + 2,
                        index + 1,
                    )
                }
                const len = index - this.offset
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
                    throw new CompilerError(
                        `character '${c}' cannot be handled. BARE only supports ASCII characters for identifiers.`,
                        this.location(),
                    )
                }
            }
        }
        this._token = ""
    }
}
