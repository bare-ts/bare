#!/usr/bin/node

import {
    BareConfigError,
    BareParserError,
    generate,
    normalize,
    parse,
} from "@bare-ts/tools"
import { Argument, Command } from "commander"
import * as fs from "node:fs"
import { relative, resolve } from "node:path"

const program = new Command().name("bare-ast").version("1.0.0")

program
    .description("Generate tests data")
    .usage("dir")
    .addArgument(
        new Argument("[dir]", "directory of tests data").default("tests-data")
    )
    .action((root) => {
        for (let dir of fs.readdirSync(root)) {
            dir = resolve(root, dir)
            if (fs.lstatSync(dir).isDirectory()) {
                const configPath = resolve(dir, "config.json")
                const config = fs.existsSync(configPath)
                    ? JSON.parse(fs.readFileSync(configPath).toString())
                    : {}
                const schemaPath = resolve(dir, "schema.bare")
                const schemaRelPath = relative(root, schemaPath)
                const content = fs.readFileSync(schemaPath).toString()
                const errorPath = resolve(dir, "error.gen.json")
                const astPath = resolve(dir, "ast.gen.json")
                const ast2Path = resolve(dir, "normalized-ast.gen.json")
                const tsPath = resolve(dir, "out.gen.ts")
                const dtsPath = resolve(dir, "out.gen.d.ts")
                const jsPath = resolve(dir, "out.gen.js")
                try {
                    const ast = parse(content, schemaRelPath, config)
                    // clean-up
                    if (fs.existsSync(errorPath)) {
                        fs.unlinkSync(errorPath)
                    }
                    fs.writeFileSync(astPath, JSON.stringify(ast, null, 2))
                    const normalizedAst = normalize(ast)
                    if (ast !== normalizedAst) {
                        fs.writeFileSync(
                            ast2Path,
                            JSON.stringify(normalizedAst, null, 2)
                        )
                    }
                    let out = generate(
                        normalizedAst,
                        Object.assign(config, { generator: "ts" })
                    )
                    fs.writeFileSync(tsPath, out)
                    out = generate(
                        normalizedAst,
                        Object.assign(config, { generator: "js" })
                    )
                    fs.writeFileSync(jsPath, out)
                    out = generate(
                        normalizedAst,
                        Object.assign(config, { generator: "dts" })
                    )
                    fs.writeFileSync(dtsPath, out)
                } catch (e) {
                    if (e instanceof BareParserError) {
                        // Error.message is not enumerable and then is not serialized
                        const ex = { ...e, message: e.message }
                        fs.writeFileSync(errorPath, JSON.stringify(ex, null, 2))
                        // clean-up
                        if (fs.existsSync(astPath)) {
                            fs.unlinkSync(astPath)
                            fs.unlinkSync(tsPath)
                            fs.unlinkSync(jsPath)
                            fs.unlinkSync(dtsPath)
                        }
                        if (fs.existsSync(ast2Path)) {
                            fs.unlinkSync(ast2Path)
                        }
                    } else if (e instanceof BareConfigError) {
                        const ex = { ...e, message: e.message }
                        fs.writeFileSync(errorPath, JSON.stringify(ex, null, 2))
                        // clean-up
                        if (fs.existsSync(tsPath)) {
                            fs.unlinkSync(tsPath)
                            fs.unlinkSync(jsPath)
                            fs.unlinkSync(dtsPath)
                        }
                        if (fs.existsSync(ast2Path)) {
                            fs.unlinkSync(ast2Path)
                        }
                    } else {
                        throw e
                    }
                }
            }
        }
    })

program.parse()
