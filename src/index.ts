//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { configure } from "./ast/bare-configure.js"
import { normalize } from "./ast/bare-normalization.js"
import { checkSemantic } from "./ast/bare-semantic-checker.js"
import { Config } from "./core/config.js"
import { generateBare } from "./generator/bare-generator.js"
import { generate } from "./generator/js-generator.js"
import { parse } from "./parser/bare-parser.js"

export * from "./ast/bare-ast.js"
export * from "./ast/bare-configure.js"
export * from "./ast/bare-normalization.js"
export * from "./core/compiler-error.js"
export * from "./core/config.js"
export * from "./generator/js-generator.js"
export * from "./parser/bare-parser.js"
export * from "./parser/bare-lex.js"

/**
 * Turn the schema `content` into a target language, taking `conf` into account.
 *
 * @example
 * ```js
 * const input = "type Person struct { name: str }"
 * const tsOutput = transform(input)
 * ```
 *
 * @example
 * ```js
 * const input = "type Person struct { name: str }"
 * const dtsOutput = transform(input, { generator: "dts" })
 * ```
 *
 * @throws {@link CompilerError} if parsing failed.
 * @throws {@link ConfigError} if the code generator cannot be determinate or
 * the format of the schema is not a supported.
 */
export function transform(content: string, conf: Partial<Config> = {}): string {
    const completedConfig = Config(conf)
    const schema = parse(content, completedConfig)
    const configured = configure(schema, completedConfig)
    checkSemantic(configured, completedConfig)
    if (completedConfig.generator === "bare") {
        return generateBare(schema)
    }
    const normalizedSchema = normalize(configured)
    return generate(normalizedSchema, completedConfig)
}
