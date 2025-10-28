//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { check } from "./check.ts"
import { Config } from "./config.ts"
import { configure } from "./configure.ts"
import { generateBare } from "./generate-bare.ts"
import { generateJs } from "./generate-js.ts"
import { normalize } from "./normalize.ts"
import { parse } from "./parse.ts"

export * from "./ast.ts"
export { check } from "./check.ts"
export { Config } from "./config.ts"
export { configure } from "./configure.ts"
export { generateBare } from "./generate-bare.ts"
export { generateJs } from "./generate-js.ts"
export { normalize } from "./normalize.ts"
export { parse } from "./parse.ts"

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
    check(configured, completedConfig)
    if (completedConfig.generator === "bare") {
        return generateBare(schema)
    }
    const normalizedSchema = normalize(configured)
    return generateJs(normalizedSchema, completedConfig)
}
