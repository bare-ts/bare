import { Lex } from "@bare-ts/tools"
import { default as test } from "oletus"

const SAMPLE = `
    const C_1 = { # struct
        prop: 1,
    }
    `

const SAMPLE_TOKENS = ["const", "C_1", "=", "{", "prop", ":", "1", ",", "}"]

test("valid-tokens", (t) => {
    const lex = new Lex(SAMPLE, "inline")
    for (let i = 0; i < SAMPLE_TOKENS.length; i++) {
        t.deepEqual(lex.token(), SAMPLE_TOKENS[i])
        t.doesNotThrow(() => lex.forth())
    }
})

test("invalid-tokens", (t) => {
    const lex = new Lex("d à", "inline")
    t.throws(() => lex.forth(), {
        name: "BareParserError",
    })
})
