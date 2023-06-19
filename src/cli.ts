#!/usr/bin/env node

//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { Config, transform } from "./index.js"
import { Argument, Option, program } from "commander"
import * as fs from "node:fs"
import * as process from "node:process"

// WARNING: This constant MUST be defined at build time.
declare const VERSION: string

const REPOSITORY_HELP = `Repository:
  https://github.com/bare-ts/tools`

const EXTRA_HELP = `
Examples:
  # Compile schema.bare into Typescript
  bare compile schema.bare -o output.ts

  # more examples
  bare <command> --help

${REPOSITORY_HELP}
`

const COMPILE_EXTRA_HELP = `
Examples:
  # Compile schema.bare into Typescript, TypeScript Declaration, or JavaScript
  bare compile schema.bare -o output.ts
  bare compile schema.bare -o output.d.ts
  bare compile schema.bare -o output.js

  # Provide input via stdin, get output via stdout
  bare compile < schema.bare > output.ts
  bare compile --generator dts < schema.bare > output.d.ts
  bare compile --generator js < schema.bare > output.js

${REPOSITORY_HELP}
`

program
    .name("bare")
    .description("Tools for BARE (Binary Application Record Encoding)")
    .version(VERSION, "--version", "output the version number and exit")
    .addHelpText("after", EXTRA_HELP)
    .action(() => program.help())

program
    .command("compile")
    .description("Compile a BARE schema into a TypeScript or JavaScript file")
    .addArgument(
        new Argument("[schema]", "BARE schema file").default(0, "stdin"),
    )
    .addOption(
        new Option("-o, --out <file>", "destination of output").default(
            1,
            "stdout",
        ),
    )
    .addOption(
        new Option("--generator <generator>", "output generator").choices([
            "bare",
            "dts",
            "js",
            "ts",
        ]),
    )
    .option("--legacy", "allow legacy BARE syntax and features")
    .option("--lib", "do not generate decoders and encoders of root types")
    .option(
        "--pedantic",
        "require enum and union types to set all tags in-order",
    )
    .option("--import-config", "import custom runtime config")
    .option("--use-class", "use classes instead of interfaces for structs")
    .option("--use-generic-array", "use generic arrays instead of typed arrays")
    .option("--use-int-enum", "use integers for enum values instead of strings")
    .option(
        "--use-int-tag",
        "always use integers for union tags instead of strings",
    )
    .option("--use-mutable", "use mutable types")
    .option(
        "--use-primitive-flat-union",
        "use flat unions instead of tagged unions for unions of primitive types",
    )
    .option("--use-safe-int", "use safe integers instead of bigint")
    .option(
        "--use-struct-flat-union",
        "use flat unions instead of tagged unions for unions of anonymous and aliased structs",
    )
    .option(
        "--use-undefined",
        "use undefined instead of null for optional types",
    )
    .addHelpText("after", COMPILE_EXTRA_HELP)
    .action(compileAction)

program.parse()

function compileAction(schema: string | number, opts: Partial<Config>): void {
    try {
        const config = Config({ ...opts, schema })
        const content = fs.readFileSync(schema).toString()
        const compiled = transform(content, config)
        fs.writeFileSync(config.out ?? 1, compiled)
    } catch (e) {
        console.error(`error: ${e instanceof Error ? e.message : e}`)
        process.exit(1)
    }
}
