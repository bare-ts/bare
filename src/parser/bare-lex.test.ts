//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { Lex } from "./bare-lex.js"
import { expect, test } from "bun:test"

const SAMPLE = `
    const C = { # struct
        p1: 1,
        p2: a,
    }
    `

const SAMPLE_TOKENS = "const C = { p1 : 1 , p2 : a , }".split(" ")

test("valid-tokens", () => {
    const lex = new Lex(SAMPLE, "inline")
    for (let i = 0; i < SAMPLE_TOKENS.length; i++) {
        expect(lex.token()).toEqual(SAMPLE_TOKENS[i])
        expect(() => lex.forth()).not.toThrow()
    }
})

test("invalid-tokens", () => {
    const lex = new Lex("d ^", "inline")
    expect(() => lex.forth()).toThrow()
})

test("comment-eof", () => {
    const content = "# comment"
    const lex = new Lex(content, "inline")
    expect(lex.location().col).toEqual(content.length + 1)
})

test("doc-comment", () => {
    const content = "## doc-comment"
    const lex = new Lex(content, "inline")
    expect(lex.location().col).toEqual(content.length + 1)
    expect(lex.consumeDocComment()).toEqual(" doc-comment")
})
