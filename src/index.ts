//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { check } from "./checker.ts"
import { configure } from "./configurer.ts"
import { Config } from "./core.ts"
import { generateBare } from "./gen-bare.ts"
import { generateJs } from "./gen-js.ts"
import { normalize } from "./normalizer.ts"
import { parse } from "./parser.ts"

export * from "./ast.ts"
export { check } from "./checker.ts"
export { configure } from "./configurer.ts"
export { Config } from "./core.ts"
export { generateBare } from "./gen-bare.ts"
export { generateJs } from "./gen-js.ts"
export { normalize } from "./normalizer.ts"
export { parse } from "./parser.ts"

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
