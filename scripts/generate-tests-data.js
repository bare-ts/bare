#!/usr/bin/env node

import { Config, transform, parse } from "@bare-ts/tools"
import * as fs from "node:fs"
import * as path from "node:path"

const TESTS_DATA_DIR = "./tests-data/"

for (let dir of fs.readdirSync(TESTS_DATA_DIR)) {
    dir = path.resolve(TESTS_DATA_DIR, dir)
    if (!fs.lstatSync(dir).isDirectory()) {
        continue
    }
    const schemaPath = path.resolve(dir, "schema.bare")
    const errorPath = path.resolve(dir, "error.gen.json")
    const astPath = path.resolve(dir, "ast.gen.json")
    const tsPath = path.resolve(dir, "out.gen.ts")
    const jsPath = path.resolve(dir, "out.gen.js")
    const dtsPath = path.resolve(dir, "out.gen.d.ts")
    for (const f of [errorPath, astPath, tsPath, dtsPath, jsPath]) {
        if (fs.existsSync(f)) {
            fs.unlinkSync(f) // clean-up
        }
    }
    const configPath = path.resolve(dir, "config.json")
    const conf = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath).toString())
        : {}
    const schema = path.relative(TESTS_DATA_DIR, schemaPath)
    const content = fs.readFileSync(schemaPath).toString()
    try {
        const ast = parse(content, Config({ ...conf, schema }))
        fs.writeFileSync(astPath, JSON.stringify(ast, null, 2))
        let out
        out = transform(content, { ...conf, schema, generator: "ts" })
        fs.writeFileSync(tsPath, out)
        out = transform(content, { ...conf, schema, generator: "js" })
        fs.writeFileSync(jsPath, out)
        out = transform(content, { ...conf, schema, generator: "dts" })
        fs.writeFileSync(dtsPath, out)
    } catch (e) {
        if (e instanceof Error) {
            // Error#message is not enumerable => is not serializable
            const ex = { ...e, message: e.message }
            fs.writeFileSync(errorPath, JSON.stringify(ex, null, 2))
        } else {
            throw e
        }
    }
}
