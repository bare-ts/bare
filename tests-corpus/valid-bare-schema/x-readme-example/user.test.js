//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { default as test } from "oletus"

import { Gender, decodeContacts, encodeContacts } from "./out.gen.js"

test("x-readme-example", (t) => {
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

    t.deepEqual(msg, [
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
