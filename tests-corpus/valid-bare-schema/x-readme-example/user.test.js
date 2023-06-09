//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { expect, test } from "bun:test"

import { Gender, decodeContacts, encodeContacts } from "./out.gen.js"

test("x-readme-example", () => {
    const payload = encodeContacts([
        {
            tag: "Person",
            val: {
                name: "Seldon",
                email: "seldon@foundation.org",
                gender: Gender.MALE,
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

    expect(msg).toEqual([
        {
            tag: "Person",
            val: {
                name: "Seldon",
                email: "seldon@foundation.org",
                gender: Gender.MALE,
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
