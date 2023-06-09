//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { expect, test } from "bun:test"

import { Department, decodePerson, encodePerson } from "./out.gen.js"

test("x-readme-example", () => {
    const payload1 = encodePerson({
        tag: "Customer",
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
        tag: "Employee",
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
        tag: "TerminatedEmployee",
        val: null,
    })
    const msg1 = decodePerson(payload1)
    const msg2 = decodePerson(payload2)
    const msg3 = decodePerson(payload3)

    expect(msg1).toEqual({
        tag: "Customer",
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

    expect(msg2).toEqual({
        tag: "Employee",
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

    expect(msg3).toEqual({
        tag: "TerminatedEmployee",
        val: null,
    })
})
