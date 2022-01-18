#!/usr/bin/env node

import { Argument, Command, Option } from "commander"
import * as fs from "node:fs"
import {
    type BareParserConfig,
    type CodeGenConfig,
    compile,
    BareConfigError,
} from "./index.js"

interface BareOptions
    extends Partial<BareParserConfig>,
        Partial<CodeGenConfig> {
    readonly out: string | number
}

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

const program = new Command()

program
    .name("bare-ts")
    .description("Tools for BARE (Binary Application Record Encoding)")
    .version("0.1.1", "--version", "output the version number and exit")
    .addHelpText("after", EXTRA_HELP)
    .action(() => program.help())

program
    .command("compile")
    .description("Compile a bare schema into a Typescript or JavaScript file")
    .addArgument(
        new Argument("[schema]", "bare schema file").default(0, "stdin")
    )
    .addOption(
        new Option("-o, --out <file>", "destination of output").default(
            1,
            "stdout"
        )
    )
    .addOption(
        new Option("--generator <generator>", "output generator").choices([
            "dts",
            "js",
            "ts",
        ])
    )
    .option(
        "--main <aliases...>",
        "space-separated list of types used to encode and decode messages"
    )
    .option("--import-config", "import custom runtime config")
    .option("--import-factory", "import custom struct factory")
    .option("--use-class", "use classes instead of interfaces for structs")
    .option("--use-flat-union", "use flat unions instead of tagged unions")
    .option("--use-generic-array", "use generic arrays instead of typed arrays")
    .option("--use-int-enum", "use integers for enum values instead of strings")
    .option("--use-mutable", "use mutable types")
    .option("--use-null", "return null instead of undefined for optional types")
    .option(
        "--use-lax-optional",
        "accept null and undefined values for optional types"
    )
    .option("--use-safe-int", "use safe integers instead of bigint")
    .addHelpText("after", COMPILE_EXTRA_HELP)
    .action(compileAction)

program.parse()

function compileAction(schemaPath: string | number, opts: BareOptions): void {
    const schemaId = typeof schemaPath === "number" ? "/dev/stdin" : schemaPath
    try {
        opts = completeOptions(schemaPath, opts)
        const content = fs.readFileSync(schemaPath).toString()
        const compiled = compile(content, schemaId, opts)
        fs.writeFileSync(opts.out, compiled)
    } catch (e) {
        console.error(e instanceof Error ? e.message : e)
        process.exit(1)
    }
}

function completeOptions(
    schemaPath: string | number,
    opts: BareOptions
): BareOptions {
    if (typeof schemaPath === "string" && !schemaPath.endsWith(".bare")) {
        throw new BareConfigError(
            "A file containing a BARE schema must end with extension '.bare'"
        )
    }
    const generator =
        typeof opts.out === "string" && opts.out.endsWith(".d.ts")
            ? "dts"
            : typeof opts.out === "string" && opts.out.endsWith(".ts")
            ? "ts"
            : typeof opts.out === "string" && opts.out.endsWith(".js")
            ? "js"
            : typeof opts.out === "number" && opts.generator === undefined
            ? "ts"
            : opts.generator
    if (generator === undefined) {
        throw new BareConfigError(
            "The code generator to use cannot be determinate. Please use the option --generator"
        )
    }
    return { ...opts, generator }
}
