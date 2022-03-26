import { Lex } from "@bare-ts/tools"
import { default as test } from "oletus"

const SAMPLE = `
    const C = { # struct
        p1: 1,
        p2: 'é',
    }
    `

const SAMPLE_TOKENS = "const C = { p1 : 1 , p2 : 'é' , }".split(" ")

const LEX_CONFIG = { commentMark: "#" }

test("valid-tokens", (t) => {
    const lex = new Lex(SAMPLE, "inline", LEX_CONFIG)
    for (let i = 0; i < SAMPLE_TOKENS.length; i++) {
        t.deepEqual(lex.token(), SAMPLE_TOKENS[i])
        t.doesNotThrow(() => lex.forth())
    }
})

test("invalid-tokens", (t) => {
    const lex = new Lex("d à", "inline", LEX_CONFIG)
    t.throws(() => lex.forth(), {
        name: "CompilerError",
    })
})

test("comment-eof", (t) => {
    const content = "# comment"
    const lex = new Lex(content, "inline", LEX_CONFIG)
    t.deepEqual(lex.location().col, content.length + 1)
})
