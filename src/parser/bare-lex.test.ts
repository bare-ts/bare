//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { Lex } from "./bare-lex.js"
import { strict as assert } from "node:assert"
import { default as test } from "oletus"

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
        assert.deepEqual(lex.token(), SAMPLE_TOKENS[i])
        assert.doesNotThrow(() => lex.forth())
    }
})

test("invalid-tokens", () => {
    const lex = new Lex("d ^", "inline")
    assert.throws(() => lex.forth(), {
        name: "CompilerError",
    })
})

test("comment-eof", () => {
    const content = "# comment"
    const lex = new Lex(content, "inline")
    assert.deepEqual(lex.location().col, content.length + 1)
})

test("doc-comment", () => {
    const content = "## doc-comment"
    const lex = new Lex(content, "inline")
    assert.deepEqual(lex.location().col, content.length + 1)
    assert.deepEqual(lex.consumeDocComment(), " doc-comment")
})
