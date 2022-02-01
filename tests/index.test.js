import {
    ConfigError,
    BareParserError,
    compile,
    generate,
    normalize,
    parse,
    Config,
} from "@bare-ts/tools"
import fs from "node:fs"
import { relative, resolve } from "node:path"
import { default as test } from "oletus"

const DATA_DIR = "./tests-data"

test("parse", (t) => {
    for (let dir of fs.readdirSync(DATA_DIR)) {
        dir = resolve(DATA_DIR, dir)
        if (fs.lstatSync(dir).isDirectory()) {
            const schemaPath = resolve(dir, "schema.bare")
            const schema = relative(DATA_DIR, schemaPath)
            const content = fs.readFileSync(schemaPath).toString()
            const configPath = resolve(dir, "config.json")
            const config = fs.existsSync(configPath)
                ? JSON.parse(fs.readFileSync(configPath).toString())
                : {}
            let actual
            let filename = "ast.gen.json"
            try {
                actual = parse(content, Config({ ...config, schema }))
            } catch (e) {
                if (!(e instanceof BareParserError)) throw e
                filename = "error.gen.json"
                actual = { ...e, message: e.message }
            }
            const path = resolve(dir, filename)
            const relPath = relative(DATA_DIR, path)
            t.ok(fs.existsSync(path), `file ${relPath} must exist`)
            const expected = JSON.parse(fs.readFileSync(path).toString())
            t.deepEqual(actual, expected, `actual must match ${relPath}`)
        }
    }
})

test("normalize", (t) => {
    for (let dir of fs.readdirSync(DATA_DIR)) {
        dir = resolve(DATA_DIR, dir)
        const astPath = resolve(dir, "ast.gen.json")
        const ast2Path = resolve(dir, "normalized-ast.gen.json")
        if (
            fs.lstatSync(dir).isDirectory() &&
            fs.existsSync(astPath) &&
            fs.existsSync(ast2Path)
        ) {
            const ast2RelPath = relative(DATA_DIR, ast2Path)
            t.ok(fs.existsSync(ast2Path), `${ast2RelPath} must exist`)

            const ast = JSON.parse(fs.readFileSync(astPath).toString())
            const ast2 = JSON.parse(fs.readFileSync(ast2Path).toString())
            const computed = normalize(ast)
            t.deepEqual(computed, ast2, `ast must match ${ast2RelPath}`)
        }
    }
})

test("generate", (t) => {
    for (let dir of fs.readdirSync(DATA_DIR)) {
        dir = resolve(DATA_DIR, dir)
        const normalizedAstPath = resolve(dir, "normalized-ast.gen.json")
        const astPath = fs.existsSync(normalizedAstPath)
            ? normalizedAstPath
            : resolve(dir, "ast.gen.json")
        if (fs.lstatSync(dir).isDirectory() && fs.existsSync(astPath)) {
            const ast = JSON.parse(fs.readFileSync(astPath).toString())
            const configPath = resolve(dir, "config.json")
            const config = fs.existsSync(configPath)
                ? JSON.parse(fs.readFileSync(configPath).toString())
                : {}

            try {
                const tsComputed = generate(
                    ast,
                    Object.assign(config, { generator: "ts" })
                )
                const dtsComputed = generate(
                    ast,
                    Object.assign(config, { generator: "dts" })
                )
                const jsComputed = generate(
                    ast,
                    Object.assign(config, { generator: "js" })
                )

                const tsPath = resolve(dir, "out.gen.ts")
                const tsRelPath = relative(DATA_DIR, tsPath)
                const dtsPath = resolve(dir, "out.gen.d.ts")
                const dtsRelPath = relative(DATA_DIR, tsPath)
                const jsPath = resolve(dir, "out.gen.js")
                const jsRelPath = relative(DATA_DIR, jsPath)
                t.ok(fs.existsSync(tsPath), `${tsRelPath} must exist`)
                t.ok(fs.existsSync(dtsPath), `${dtsRelPath} must exist`)
                t.ok(fs.existsSync(jsPath), `${jsRelPath} must exist`)

                const tsContent = fs.readFileSync(tsPath).toString()
                const dtsContent = fs.readFileSync(dtsPath).toString()
                const jsContent = fs.readFileSync(jsPath).toString()

                t.deepEqual(
                    tsComputed,
                    tsContent,
                    `out must match ${tsRelPath}`
                )
                t.deepEqual(
                    dtsComputed,
                    dtsContent,
                    `out must match ${dtsRelPath}`
                )
                t.deepEqual(
                    jsComputed,
                    jsContent,
                    `out must match ${jsRelPath}`
                )
            } catch (e) {
                if (e instanceof ConfigError) {
                    const errorPath = resolve(dir, "error.gen.json")
                    const errorRelPath = relative(DATA_DIR, errorPath)
                    t.ok(fs.existsSync(errorPath), `${errorRelPath} must exist`)

                    const errorContent = JSON.parse(
                        fs.readFileSync(errorPath).toString()
                    )
                    t.deepEqual(
                        { ...e, message: e.message },
                        errorContent,
                        `error must match ${errorRelPath}`
                    )
                } else {
                    throw e
                }
            }
        }
    }
})

test("compile", (t) => {
    for (let dir of fs.readdirSync(DATA_DIR)) {
        dir = resolve(DATA_DIR, dir)
        if (fs.lstatSync(dir).isDirectory()) {
            const schemaPath = resolve(dir, "schema.bare")
            const schema = relative(DATA_DIR, schemaPath)
            const content = fs.readFileSync(schemaPath).toString()
            const configPath = resolve(dir, "config.json")
            const config = fs.existsSync(configPath)
                ? JSON.parse(fs.readFileSync(configPath).toString())
                : {}
            try {
                const result = compile(content, { ...config, schema })

                const tsPath = resolve(dir, "out.gen.ts")
                const tsRelPath = relative(DATA_DIR, tsPath)
                t.ok(fs.existsSync(tsPath), `${tsRelPath} must exist`)

                const tsContent = fs.readFileSync(tsPath).toString()

                t.deepEqual(result, tsContent, `out must match ${tsRelPath}`)
            } catch (e) {
                if (e instanceof BareParserError || e instanceof ConfigError) {
                    const errorPath = resolve(dir, "error.gen.json")
                    const errorRelPath = relative(DATA_DIR, errorPath)
                    t.ok(fs.existsSync(errorPath), `${errorRelPath} must exist`)

                    const errorContent = JSON.parse(
                        fs.readFileSync(errorPath).toString()
                    )
                    t.deepEqual(
                        errorContent,
                        { ...e, message: e.message },
                        `error must match ${errorRelPath}`
                    )
                } else {
                    throw e
                }
            }
        }
    }
})
