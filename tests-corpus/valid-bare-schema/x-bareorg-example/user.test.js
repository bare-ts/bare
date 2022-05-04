//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { default as test } from "oletus"
import { decodePerson, encodePerson, Department } from "./out.gen.js"

test("x-readme-example", (t) => {
    const payload1 = encodePerson({
        tag: /* Customer *: */ 0,
        val: {
            name: "James Smith",
            email: "jsmith@example.org",
            address: ["123 Main St", "Philadelphia", "PA", "United States"],
            orders: [
                {
                    orderId: 4242424242,
                    quantity: 5,
                },
            ],
            metadata: new Map(),
        },
    })
    const payload2 = encodePerson({
        tag: /* Employee *: */ 1,
        val: {
            name: "Tiffany Doe",
            email: "tiffanyd@acme.corp",
            address: ["123 Main St", "Philadelphia", "PA", "United States"],
            department: Department.ADMINISTRATION,
            hireDate: "2020-06-21T21:18:05Z",
            publicKey: null,
            metadata: new Map([["photo", new ArrayBuffer(5)]]),
        },
    })
    const payload3 = encodePerson({
        tag: /* Terminated Employee *: */ 2,
        val: null,
    })
    const msg1 = decodePerson(payload1)
    const msg2 = decodePerson(payload2)
    const msg3 = decodePerson(payload3)

    t.deepEqual(msg1, {
        tag: /* Customer *: */ 0,
        val: {
            name: "James Smith",
            email: "jsmith@example.org",
            address: ["123 Main St", "Philadelphia", "PA", "United States"],
            orders: [
                {
                    orderId: 4242424242,
                    quantity: 5,
                },
            ],
            metadata: new Map(),
        },
    })

    t.deepEqual(msg2, {
        tag: /* Employee *: */ 1,
        val: {
            name: "Tiffany Doe",
            email: "tiffanyd@acme.corp",
            address: ["123 Main St", "Philadelphia", "PA", "United States"],
            department: Department.ADMINISTRATION,
            hireDate: "2020-06-21T21:18:05Z",
            publicKey: null,
            metadata: new Map([["photo", new ArrayBuffer(5)]]),
        },
    })

    t.deepEqual(msg3, {
        tag: /* Terminated Employee *: */ 2,
        val: null,
    })
})
