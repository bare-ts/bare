//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { configure } from "./ast/bare-configure.ts"
import { normalize } from "./ast/bare-normalization.ts"
import { checkSemantic } from "./ast/bare-semantic-checker.ts"
import { Config } from "./core/config.ts"
import { generateBare } from "./generator/bare-generator.ts"
import { generate } from "./generator/js-generator.ts"
import { parse } from "./parser/bare-parser.ts"

export * from "./ast/bare-ast.ts"
export * from "./ast/bare-configure.ts"
export * from "./ast/bare-normalization.ts"
export * from "./core/compiler-error.ts"
export * from "./core/config.ts"
export * from "./generator/js-generator.ts"
export * from "./parser/bare-parser.ts"

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
