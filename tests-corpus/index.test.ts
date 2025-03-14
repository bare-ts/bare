//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as assert from "node:assert/strict"
import fs from "node:fs"
import { relative, resolve } from "node:path"
import { test } from "node:test"
import { configure } from "../src/configurer.ts"
import { CompilerError, Config } from "../src/core.ts"
import { transform } from "../src/index.ts"
import { parse } from "../src/parser.ts"

const CORPUS_DIR = "./tests-corpus"
const INVALID_BARE_DIR = `${CORPUS_DIR}/invalid-bare-schema`
const VALID_BARE_DIR = `${CORPUS_DIR}/valid-bare-schema`

for (const relDir of fs.readdirSync(INVALID_BARE_DIR)) {
    const dir = resolve(INVALID_BARE_DIR, relDir)

    test(relative(CORPUS_DIR, dir), () => {
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
            const astComputed = configure(parse(schema, config), config)
            assert.deepEqual(astComputed, astExpected)
            transform(schema, config)
            assert.ok(false) // must be unreachable
        } catch (e) {
            if (!(e instanceof CompilerError)) {
                throw e
            }
            assert.deepEqual({ ...e, message: e.message }, error)
        }
    })
}

for (let dir of fs.readdirSync(VALID_BARE_DIR)) {
    dir = resolve(VALID_BARE_DIR, dir)

    test(relative(CORPUS_DIR, dir), () => {
        const schemaPath = resolve(dir, "schema.bare")
        const schemaRelPath = relative(VALID_BARE_DIR, schemaPath)
        const configPath = resolve(dir, "config.json")
        const astPath = resolve(dir, "ast.gen.json")
        const tsPath = resolve(dir, "out.gen.ts")
        const dtsPath = resolve(dir, "out.gen.d.ts")
        const jsPath = resolve(dir, "out.gen.js")
        const barePath = resolve(dir, "out.gen.bare")

        const schema = fs.readFileSync(schemaPath).toString()
        const config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath).toString())
            : {}
        const astExpected = JSON.parse(fs.readFileSync(astPath).toString())
        const tsExpected = fs.readFileSync(tsPath).toString()
        const dtsExpected = fs.readFileSync(dtsPath).toString()
        const jsExpected = fs.readFileSync(jsPath).toString()
        const bareExpected = fs.readFileSync(barePath).toString()
        const completedConfig = Config({
            ...config,
            generator: "ts",
            schema: schemaRelPath,
        })
        const astComputed = configure(
            parse(schema, completedConfig),
            completedConfig,
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
        const bareComputed = transform(schema, {
            ...config,
            generator: "bare",
            schema: schemaRelPath,
        })

        assert.deepEqual(astComputed, astExpected)
        assert.deepEqual(tsComputed, tsExpected)
        assert.deepEqual(dtsComputed, dtsExpected)
        assert.deepEqual(jsComputed, jsExpected)
        assert.deepEqual(bareComputed, bareExpected)
    })
}
