//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { CompilerError, Config, parse, transform } from "@bare-ts/tools"
import fs from "node:fs"
import { relative, resolve } from "node:path"
import { default as test } from "oletus"

const CORPUS_DIR = "./tests-corpus"
const INVALID_BARE_DIR = `${CORPUS_DIR}/invalid-bare-schema`
const INVALID_CONFIG_DIR = `${CORPUS_DIR}/invalid-config`
const VALID_BARE_DIR = `${CORPUS_DIR}/valid-bare-schema`

for (const relDir of fs.readdirSync(INVALID_BARE_DIR)) {
    const dir = resolve(INVALID_BARE_DIR, relDir)

    test(relative(CORPUS_DIR, dir), (t) => {
        const schemaPath = resolve(dir, "schema.bare")
        const configPath = resolve(dir, "config.json")
        const astPath = resolve(dir, "ast.gen.json")
        const errorPath = resolve(dir, "error.gen.json")
        const schema = fs.readFileSync(schemaPath).toString()
        const astExpected = fs.existsSync(astPath)
            ? JSON.parse(fs.readFileSync(astPath).toString())
            : {}
        let config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath).toString())
            : {}
        config = Config({
            ...config,
            generator: "ts",
            schema: relative(INVALID_BARE_DIR, schemaPath),
        })
        const error = JSON.parse(fs.readFileSync(errorPath).toString())
        try {
            const astComputed = parse(schema, config)
            t.deepEqual(astComputed, astExpected)
            void transform(schema, config)
            t.ok(false) // must be unreachable
        } catch (e) {
            if (!(e instanceof CompilerError)) throw e
            t.deepEqual({ ...e, message: e.message }, error)
        }
    })
}

for (let dir of fs.readdirSync(INVALID_CONFIG_DIR)) {
    dir = resolve(INVALID_CONFIG_DIR, dir)

    test(relative(CORPUS_DIR, dir), (t) => {
        const schemaPath = resolve(dir, "schema.bare")
        const configPath = resolve(dir, "config.json")
        const errorPath = resolve(dir, "error.gen.json")
        const schema = fs.readFileSync(schemaPath).toString()
        const config = JSON.parse(fs.readFileSync(configPath).toString())
        const error = JSON.parse(fs.readFileSync(errorPath).toString())
        try {
            void transform(schema, {
                ...config,
                generator: "ts",
                schema: relative(INVALID_CONFIG_DIR, schemaPath),
            })
            t.ok(false) // must be unreachable
        } catch (e) {
            if (!(e instanceof Error)) throw e
            t.deepEqual({ ...e, message: e.message }, error)
        }
    })
}

for (let dir of fs.readdirSync(VALID_BARE_DIR)) {
    dir = resolve(VALID_BARE_DIR, dir)

    test(relative(CORPUS_DIR, dir), (t) => {
        const schemaPath = resolve(dir, "schema.bare")
        const schemaRelPath = relative(VALID_BARE_DIR, schemaPath)
        const configPath = resolve(dir, "config.json")
        const astPath = resolve(dir, "ast.gen.json")
        const tsPath = resolve(dir, "out.gen.ts")
        const dtsPath = resolve(dir, "out.gen.d.ts")
        const jsPath = resolve(dir, "out.gen.js")

        const schema = fs.readFileSync(schemaPath).toString()
        const config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath).toString())
            : {}
        const astExpected = JSON.parse(fs.readFileSync(astPath).toString())
        const tsExpected = fs.readFileSync(tsPath).toString()
        const dtsExpected = fs.readFileSync(dtsPath).toString()
        const jsExpected = fs.readFileSync(jsPath).toString()

        const astComputed = parse(
            schema,
            Config({
                ...config,
                generator: "ts",
                schema: schemaRelPath,
            })
        )

        const tsComputed = transform(schema, {
            ...config,
            generator: "ts",
            schema: schemaRelPath,
        })
        const dtsComputed = transform(schema, {
            ...config,
            generator: "dts",
            schema: schemaRelPath,
        })
        const jsComputed = transform(schema, {
            ...config,
            generator: "js",
            schema: schemaRelPath,
        })

        t.deepEqual(astComputed, astExpected)
        t.deepEqual(tsComputed, tsExpected)
        t.deepEqual(dtsComputed, dtsExpected)
        t.deepEqual(jsComputed, jsExpected)
    })
}
