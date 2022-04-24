#!/usr/bin/env node

//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { Argument, Option, program } from "commander"
import * as fs from "node:fs"
import { Config, transform } from "./index.js"

const REPOSITORY_HELP = `Repository:
  https://github.com/bare-ts/compiler`

const EXTRA_HELP = `
Examples:
  # Compile schema.bare into Typescript
  bare-ts compile schema.bare -o output.ts

  # more examples
  bare-ts <command> --help

${REPOSITORY_HELP}
`

const COMPILE_EXTRA_HELP = `
Examples:
  # Compile schema.bare into Typescript, TypeScript Declaration, or JavaScript
  bare-ts compile schema.bare -o output.ts
  bare-ts compile schema.bare -o output.d.ts
  bare-ts compile schema.bare -o output.js

  # Provide input via stdin, get output via stdout
  bare-ts compile < schema.bare > output.ts
  bare-ts compile --generator dts < schema.bare > output.d.ts
  bare-ts compile --generator js < schema.bare > output.js

  # Specify types that can be packed into and unpacked from messages
  bare-ts compile schema.bare -o output.ts --main Alias1 Alias2

${REPOSITORY_HELP}
`

program
    .name("bare-ts")
    .description("Tools for BARE (Binary Application Record Encoding)")
    .version("0.7.0", "--version", "output the version number and exit")
    .addHelpText("after", EXTRA_HELP)
    .action(() => program.help())

program
    .command("compile")
    .description("Compile a bare schema into a Typescript or JavaScript file")
    .addArgument(
        new Argument("[schema]", "bare schema file").default(0, "stdin"),
    )
    .addOption(
        new Option("-o, --out <file>", "destination of output").default(
            1,
            "stdout",
        ),
    )
    .addOption(
        new Option("--generator <generator>", "output generator").choices([
            "dts",
            "js",
            "ts",
        ]),
    )
    .option("--legacy-syntax", "allow legacy BARE syntax")
    .option(
        "--main <aliases...>",
        "space-separated list of types used to encode and decode messages",
    )
    .option(
        "--pedantic",
        "require enum and union types to set all tags in-order",
    )
    .option("--import-config", "import custom runtime config")
    .option("--import-factory", "import custom struct factory")
    .option("--use-class", "use classes instead of interfaces for structs")
    .option("--use-flat-union", "use flat unions instead of tagged unions")
    .option("--use-generic-array", "use generic arrays instead of typed arrays")
    .option("--use-int-enum", "use integers for enum values instead of strings")
    .option("--use-mutable", "use mutable types")
    .option(
        "--use-quoted-property",
        "use quoted property instead of unquoted property",
    )
    .option(
        "--use-lax-optional",
        "accept null and undefined values for optional types",
    )
    .option(
        "--use-undefined",
        "return undefined instead of null for optional types",
    )
    .option("--use-safe-int", "use safe integers instead of bigint")
    .addHelpText("after", COMPILE_EXTRA_HELP)
    .action(compileAction)

program.parse()

function compileAction(schema: string | number, opts: Partial<Config>): void {
    try {
        const config = Config({ ...opts, schema })
        const content = fs.readFileSync(schema).toString()
        const compiled = transform(content, config)
        fs.writeFileSync(config.out, compiled)
    } catch (e) {
        console.error(`error: ${e instanceof Error ? e.message : e}`)
        process.exit(1)
    }
}
