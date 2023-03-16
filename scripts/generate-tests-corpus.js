#!/usr/bin/env node

import { Config, configure, parse, transform } from "@bare-ts/tools"
import * as fs from "node:fs"
import * as path from "node:path"

const CORPUS_DIR = "./tests-corpus"

for (let category of fs.readdirSync(CORPUS_DIR)) {
    category = path.resolve(CORPUS_DIR, category)
    if (!fs.lstatSync(category).isDirectory()) {
        continue
    }
    for (let dir of fs.readdirSync(category)) {
        dir = path.resolve(category, dir)
        const schemaPath = path.resolve(dir, "schema.bare")
        const errorPath = path.resolve(dir, "error.gen.json")
        const astPath = path.resolve(dir, "ast.gen.json")
        const tsPath = path.resolve(dir, "out.gen.ts")
        const jsPath = path.resolve(dir, "out.gen.js")
        const dtsPath = path.resolve(dir, "out.gen.d.ts")
        const barePath = path.resolve(dir, "out.gen.bare")
        for (const f of [errorPath, astPath, tsPath, dtsPath, jsPath]) {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f) // clean-up
            }
        }
        const configPath = path.resolve(dir, "config.json")
        const config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath).toString())
            : {}
        console.info(`Generating... ${path.relative(CORPUS_DIR, dir)}`)
        const schema = path.relative(category, schemaPath)
        const content = fs.readFileSync(schemaPath).toString()
        try {
            const completedConfig = Config({ ...config, schema })
            const ast = configure(
                parse(content, completedConfig),
                completedConfig,
            )
            fs.writeFileSync(astPath, JSON.stringify(ast, null, 2))
            let out
            out = transform(content, { ...config, schema, generator: "ts" })
            fs.writeFileSync(tsPath, out)
            out = transform(content, { ...config, schema, generator: "js" })
            fs.writeFileSync(jsPath, out)
            out = transform(content, { ...config, schema, generator: "dts" })
            fs.writeFileSync(dtsPath, out)
            out = transform(content, { ...config, schema, generator: "bare" })
            fs.writeFileSync(barePath, out)
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
}
