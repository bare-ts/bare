//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { Lex } from "@bare-ts/tools"
import { default as test } from "oletus"

const SAMPLE = `
    const C = { # struct
        p1: 1,
        p2: a,
    }
    `

const SAMPLE_TOKENS = "const C = { p1 : 1 , p2 : a , }".split(" ")

test("valid-tokens", (t) => {
    const lex = new Lex(SAMPLE, "inline")
    for (let i = 0; i < SAMPLE_TOKENS.length; i++) {
        t.deepEqual(lex.token(), SAMPLE_TOKENS[i])
        t.doesNotThrow(() => lex.forth())
    }
})

test("invalid-tokens", (t) => {
    const lex = new Lex("d ^", "inline")
    t.throws(() => lex.forth(), {
        name: "CompilerError",
    })
})

test("comment-eof", (t) => {
    const content = "# comment"
    const lex = new Lex(content, "inline")
    t.deepEqual(lex.location().col, content.length + 1)
})

test("doc-comment", (t) => {
    const content = "## doc-comment"
    const lex = new Lex(content, "inline")
    t.deepEqual(lex.location().col, content.length + 1)
    t.deepEqual(lex.consumeDocComment(), " doc-comment")
})
