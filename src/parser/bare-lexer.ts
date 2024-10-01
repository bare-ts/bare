//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { CompilerError } from "../core/compiler-error.js"

const WHITE_SPACE_PATTERN = /\s/
const PUNCTUATION_PATTERN = /[{}[\]()<>=|:,;.!?~+\\/$@#-]/
const ID_PATTERN = /\w+/

export type Lexer = {
    /**
     * Content to lex.
     */
    readonly content: string

    /**
     * 0-based offset of `token` in `content`.
     */
    offset: number

    /**
     * Comments preceding `token`.
     */
    comment: string

    /**
     * Current token.
     * An empty string means that there is no more tokens to process.
     */
    token: string
}

/**
 * Create a new lexer of `content` and advance to the first token if any.
 */
export function create(content: string): Lexer {
    const result: Lexer = {
        content,
        offset: 0,
        comment: "",
        token: "",
    }
    nextToken(result)
    return result
}

/**
 * Next token.
 * Reset `lex.comment`, update `lex.token` and `lex.offset`.
 */
export function nextToken(lex: Lexer): void {
    let { content, offset, comment, token } = lex
    if (token !== "") {
        comment = ""
    }
    offset += token.length
    token = ""
    while (offset < content.length) {
        const c = content[offset] as string
        if (c === "#") {
            // comment
            let index = content.indexOf("\n", offset + 1)
            if (index === -1) {
                // EOF
                index = content.length
            }
            comment += content.slice(offset + 1, index)
            offset = index
        } else if (WHITE_SPACE_PATTERN.test(c)) {
            if (c === "\n" && comment !== "") {
                comment += "\n"
                if (comment.endsWith("\n\n")) {
                    // A blank line resets the comment register
                    comment = ""
                }
            }
            offset++
        } else {
            if (PUNCTUATION_PATTERN.test(c)) {
                token = c
                break
            }
            const suffix = content.slice(offset)
            const match = suffix.match(ID_PATTERN)
            if (match == null) {
                throw new CompilerError(
                    `character '${c}' cannot be handled. BARE only supports ASCII characters for identifiers.`,
                    offset,
                )
            }
            token = match[0]
            break
        }
    }
    lex.offset = offset
    lex.comment = comment
    lex.token = token
}
