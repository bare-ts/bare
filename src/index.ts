import { normalize } from "./ast/bare-normalization.js"
import { checkSemantic } from "./ast/bare-semantic-checker.js"
import { generate } from "./generator/js-generator.js"
import { Config } from "./core/config.js"
import { parse } from "./parser/bare-parser.js"

export * from "./ast/bare-normalization.js"
export * from "./ast/bare-ast.js"
export * from "./generator/js-generator.js"
export * from "./core/compiler-error.js"
export * from "./core/config.js"
export * from "./parser/bare-parser.js"
export * from "./parser/lex.js"

/**
 *
 * @param content
 * @param conf
 * @return code
 * @throw {BareParserError} upon parsing error
 * @throw {ConfigError} upon error in config
 */
export function transform(content: string, conf: Partial<Config> = {}): string {
    const completedConfig = Config(conf)
    const schema = parse(content, completedConfig)
    checkSemantic(schema, completedConfig)
    const normalizedSchema = normalize(schema)
    return generate(normalizedSchema, completedConfig)
}
