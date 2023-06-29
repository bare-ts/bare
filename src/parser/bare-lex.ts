//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { CompilerError, type Location } from "../core/compiler-error.js"

const WHITE_SPACE_PATTERN = /\s/
const PUNCTUATION_PATTERN = /[\{\}\[\]\(\)<>=\|:,;\.!?~+-\\/$@#]/
const ID_PATTERN = /\w+/

export class Lex {
    readonly content: string
    readonly filename: string | number | null
    private offset: number
    private line: number
    private col: number

    /**
     * Comments preceding `token`.
     */
    comment: string

    /**
     * Current token.
     * An empty string means that there is no more tokens to process.
     */
    token: string

    constructor(content: string, filename: string | number | null) {
        this.content = content
        this.filename = filename
        this.offset = 0
        this.line = 1
        this.col = 1
        this.comment = ""
        this.token = ""
        this.forth()
    }

    location(): Location {
        let { filename, offset, line, col, token } = this
        offset -= token.length
        col -= token.length
        return { filename, offset, line, col }
    }

    /**
     * Reset `comment` and move to the next `token`.
     */
    forth(): void {
        if (this.token !== "") {
            this.comment = ""
        }
        this.token = ""
        const content = this.content
        while (this.offset < content.length) {
            const c = content[this.offset]
            if (WHITE_SPACE_PATTERN.test(c)) {
                if (c === "\n") {
                    this.line++
                    this.col = 1
                    if (this.comment !== "") {
                        this.comment += "\n"
                        if (this.comment.endsWith("\n\n")) {
                            // A blank line reset the comment register
                            this.comment = ""
                        }
                    }
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
                this.comment += content.slice(this.offset + 1, index)
                const len = index - this.offset
                this.col += len
                this.offset += len
            } else {
                if (ID_PATTERN.test(c)) {
                    const suffix = content.slice(this.offset)
                    this.token = (
                        suffix.match(ID_PATTERN) as RegExpMatchArray
                    )[0]
                    this.offset += this.token.length
                    this.col += this.token.length
                    return
                } else if (PUNCTUATION_PATTERN.test(c)) {
                    this.offset++
                    this.col++
                    this.token = c
                    return
                } else {
                    throw new CompilerError(
                        `character '${c}' cannot be handled. BARE only supports ASCII characters for identifiers.`,
                        this.location(),
                    )
                }
            }
        }
    }
}
