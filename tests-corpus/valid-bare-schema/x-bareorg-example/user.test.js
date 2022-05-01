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
            address: {
                address: "123 Main St",
                city: "Philadelphia",
                state: "PA",
                country: "United States",
            },
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
            address: {
                address: "123 Main St",
                city: "Philadelphia",
                state: "PA",
                country: "United States",
            },
            department: Department.ADMINISTRATION,
            hireDate: "2020-06-21T21:18:05Z",
            publicKey: null,
            metadata: new Map(),
        },
    })
    const msg1 = decodePerson(payload1)
    const msg2 = decodePerson(payload2)

    t.deepEqual(msg1, {
        tag: /* Customer *: */ 0,
        val: {
            name: "James Smith",
            email: "jsmith@example.org",
            address: {
                address: "123 Main St",
                city: "Philadelphia",
                state: "PA",
                country: "United States",
            },
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
            address: {
                address: "123 Main St",
                city: "Philadelphia",
                state: "PA",
                country: "United States",
            },
            department: Department.ADMINISTRATION,
            hireDate: "2020-06-21T21:18:05Z",
            publicKey: null,
            metadata: new Map(),
        },
    })
})
