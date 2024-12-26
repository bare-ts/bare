//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as assert from "node:assert/strict"
import { test } from "node:test"
import * as lex from "./bare-lexer.ts"

const SAMPLE = `
    const C = { # struct
        p1: 1,
        p2: a,
    }
    `

const SAMPLE_TOKENS = "const C = { p1 : 1 , p2 : a , }".split(" ")

test("valid-tokens", () => {
    const l = lex.create(SAMPLE)
    for (let i = 0; i < SAMPLE_TOKENS.length; i++) {
        assert.deepEqual(l.token, SAMPLE_TOKENS[i])
        assert.doesNotThrow(() => lex.nextToken(l))
    }
})

test("invalid-tokens", () => {
    const l = lex.create("d ^")
    assert.throws(() => lex.nextToken(l), {
        name: "CompilerError",
    })
})

test("comment-eof", () => {
    const content = "# comment"
    const l = lex.create(content)
    assert.deepEqual(l.offset, content.length)
    assert.deepEqual(l.comment, " comment")
})

test("reset-comment", () => {
    const content = "# first\na\n# second\n\n# third\nb"
    const l = lex.create(content)
    assert.deepEqual(l.comment, " first\n")
    lex.nextToken(l)
    assert.deepEqual(l.comment, " third\n")
})
