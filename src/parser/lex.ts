//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { CompilerError, type Location } from "../core/compiler-error.js"
import { ConfigError } from "../core/config.js"

/**
 * @invariant commentMark == null || commentMark.length === 1
 */
export interface LexConfig {
    readonly commentMark: string | null
}

export function LexConfig({
    commentMark = null,
}: Partial<LexConfig>): LexConfig {
    if (commentMark !== null && commentMark.length !== 1) {
        throw new ConfigError("A comment mark must be a single char.")
    }
    return { commentMark }
}

const WHITE_SPACE_PATTERN = /\s/
const PUNCTUATION_PATTERN = /[\{\}\[\]\(\)<>=\|:,;\.!?~+-\\/$@#]/
const ID_PATTERN = /([A-Za-z0-9_]+)/

export class Lex {
    declare readonly config: LexConfig
    declare readonly content: string
    declare readonly filename: string | number
    private declare offset: number
    private declare line: number
    private declare col: number
    private declare _token: string

    constructor(
        content: string,
        filename: string | number,
        config: Partial<LexConfig> = {}
    ) {
        this.config = LexConfig(config)
        this.content = content
        this.filename = filename
        this.offset = 0
        this.line = 1
        this.col = 1
        this.forth()
    }

    token(): string {
        return this._token
    }

    location(): Location {
        let { filename, offset, line, col, _token } = this
        offset -= _token.length
        col -= _token.length
        return { filename, offset, line, col }
    }

    forth(): void {
        const { commentMark } = this.config
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
            } else if (c === commentMark) {
                // comment
                let index = content.indexOf("\n", this.offset + 1)
                if (index === -1) {
                    // EOF
                    index = content.length
                }
                const len = index - this.offset
                this.col += len
                this.offset += len
            } else if (c === "'" || c === '"') {
                // we only support simple strings (no escape)
                let index = content.indexOf(c, this.offset + 1)
                if (index === -1) {
                    // missing delimiter
                    index = content.length
                }
                const len = index + 1 - this.offset
                this._token = content.slice(this.offset, this.offset + len)
                this.col += len
                this.offset += len
                return
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
                        this.location()
                    )
                }
            }
        }
        this._token = ""
    }
}
