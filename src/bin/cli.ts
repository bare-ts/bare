#!/usr/bin/env node

//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as fs from "node:fs"
import * as process from "node:process"
import * as util from "node:util"
import { CompilerError, Config, transform } from "../index.js"

// WARNING: This constant MUST be defined at build time.
declare const VERSION: string

const HELP_TEXT = `
Usage: bare [options] [schema]

Compile a BARE (Binary Application Record Encoding) schema into a TypeScript or JavaScript file

Arguments:
  schema                      BARE schema file (default: stdin)

Options:
  -o, --out <file>            destination of output (default: stdout)
  --generator <generator>     output generator (choices: "bare", "dts", "js", "ts")
  --legacy                    allow legacy BARE syntax and features
  --lib                       do not generate decoders and encoders of root types
  --pedantic                  require enum and union types to set all tags in-order
  --use-class                 use classes instead of interfaces for structs
  --use-generic-array         use generic arrays instead of typed arrays
  --use-int-enum              use integers for enum values instead of strings
  --use-int-tag               always use integers for union tags instead of strings
  --use-mutable               use mutable types
  --use-primitive-flat-union  use flat unions instead of tagged unions for unions of primitive types
  --use-safe-int              use safe integers instead of bigint
  --use-struct-flat-union     use flat unions instead of tagged unions for unions of anonymous and aliased structs
  --use-undefined             use undefined instead of null for optional types
  --version                   output the version number and exit
  -h, --help                  display help for command

Examples:
  # Compile schema.bare into Typescript, TypeScript Declaration, or JavaScript
  bare compile schema.bare -o output.ts
  bare compile schema.bare -o output.d.ts
  bare compile schema.bare -o output.js

  # Provide input via stdin, get output via stdout
  bare compile < schema.bare > output.ts
  bare compile --generator dts < schema.bare > output.d.ts
  bare compile --generator js < schema.bare > output.js

Repository:
  https://github.com/bare-ts/tools
`

const PARSE_CONFIG = {
    allowPositionals: true,
    options: {
        help: { short: "h", type: "boolean" },
        version: { type: "boolean" },
        out: { short: "o", type: "string" },
        generator: { type: "string" },
        legacy: { type: "boolean" },
        lib: { type: "boolean" },
        pedantic: { type: "boolean" },
        "use-int-tag": { type: "boolean" },
        "use-class": { type: "boolean" },
        "use-generic-array": { type: "boolean" },
        "use-int-enum": { type: "boolean" },
        "use-mutable": { type: "boolean" },
        "use-primitive-flat-union": { type: "boolean" },
        "use-safe-int": { type: "boolean" },
        "use-struct-flat-union": { type: "boolean" },
        "use-undefined": { type: "boolean" },
    },
} as const

main()

function main(): void {
    try {
        const { values, positionals } = util.parseArgs(PARSE_CONFIG)
        if (values.help) {
            console.info(HELP_TEXT)
        } else if (values.version) {
            console.info(VERSION)
        } else {
            let schemaIndex = 0
            if (positionals.length > 0 && positionals[0] === "compile") {
                schemaIndex = 1
            }
            if (positionals.length > schemaIndex + 1) {
                console.error("only one schema argument is expected")
                process.exit(1)
            }
            const schema =
                positionals.length > schemaIndex ? positionals[schemaIndex] : 0
            const generator = values.generator
            if (
                generator != null &&
                generator !== "bare" &&
                generator !== "dts" &&
                generator !== "js" &&
                generator !== "ts"
            ) {
                console.error("Invalid <generator> value")
                process.exit(1)
            }
            compileAction(schema, {
                generator,
                legacy: values.legacy,
                lib: values.lib,
                out: values.out,
                pedantic: values.pedantic,
                useClass: values["use-class"],
                useGenericArray: values["use-generic-array"],
                useIntEnum: values["use-int-enum"],
                useIntTag: values["use-int-tag"],
                useMutable: values["use-mutable"],
                usePrimitiveFlatUnion: values["use-primitive-flat-union"],
                useSafeInt: values["use-safe-int"],
                useStructFlatUnion: values["use-struct-flat-union"],
                useUndefined: values["use-undefined"],
            })
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message)
        }
        process.exit(1)
    }
}

function compileAction(schema: string | number, opts: Partial<Config>): void {
    let config: Config | null = null
    let content = ""
    try {
        config = Config({ ...opts, schema })
        content = fs.readFileSync(schema).toString()
        const compiled = transform(content, config)
        fs.writeFileSync(config.out ?? 1, compiled)
    } catch (e) {
        const message = `error: ${
            e instanceof CompilerError
                ? `(${formatLocation(
                      config?.schema,
                      location(content, e.offset),
                  )}) `
                : ""
        }`
        console.error(`${message}${e instanceof Error ? e.message : e}`)
        process.exit(1)
    }
}

export type Location = {
    /**
     * 1-based index
     */
    readonly line: number
    /**
     * 1-based index
     */
    readonly col: number
}

export function location(content: string, offset: number): Location {
    const normalizedOffset = Math.min(offset, content.length)
    const substring = content.slice(0, normalizedOffset + 1)
    const lineOffset = substring.lastIndexOf("\n")
    // PERF: this is not the most efficient way to compute the line number.
    // However, this should be enough for our use case (compilation on error).
    const line = substring.split("\n").length
    const col = normalizedOffset - lineOffset
    return { line, col }
}

function formatLocation(
    file: string | number | null | undefined,
    loc: Location,
): string {
    return `(${file != null ? file : "<internal>"}:${loc.line}:${loc.col}) `
}
