//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { default as test } from "oletus"
import { decodeContacts, encodeContacts, Gender } from "./out.gen.js"

test("x-readme-example", (t) => {
    const payload = encodeContacts([
        {
            tag: 0,
            val: {
                name: "Seldon",
                email: "seldon@foundation.org",
                gender: Gender.MALE,
            },
        },
        {
            tag: 1,
            val: {
                name: "Foundation",
                email: "contact@foundation.org",
            },
        },
    ])
    const msg = decodeContacts(payload)

    t.deepEqual(msg, [
        {
            tag: 0,
            val: {
                name: "Seldon",
                email: "seldon@foundation.org",
                gender: Gender.MALE,
            },
        },
        {
            tag: 1,
            val: {
                name: "Foundation",
                email: "contact@foundation.org",
            },
        },
    ])
})
