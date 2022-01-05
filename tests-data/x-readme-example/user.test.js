import { default as test } from "oletus"
import { Gender, packMessage, unpackMessage } from "./out.gen.js"

test("x-readme-example", (t) => {
    const buffer = packMessage([
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
    const msg = unpackMessage(buffer)

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
