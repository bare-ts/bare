//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as assert from "node:assert/strict"
import { test } from "node:test"

import { decodeContacts, encodeContacts, Gender } from "./out.gen.js"

test("x-readme-example", () => {
    const payload = encodeContacts([
        {
            tag: "Person",
            val: {
                name: "Seldon",
                email: "seldon@foundation.org",
                gender: Gender.Male,
            },
        },
        {
            tag: "Organization",
            val: {
                name: "Foundation",
                email: "contact@foundation.org",
            },
        },
    ])
    const msg = decodeContacts(payload)

    assert.deepEqual(msg, [
        {
            tag: "Person",
            val: {
                name: "Seldon",
                email: "seldon@foundation.org",
                gender: Gender.Male,
            },
        },
        {
            tag: "Organization",
            val: {
                name: "Foundation",
                email: "contact@foundation.org",
            },
        },
    ])
})
