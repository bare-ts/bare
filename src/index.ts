import { normalize } from "./ast/bare-ast-normalization.js"
import { generate } from "./code-gen/code-gen.js"
import { Config } from "./core/config.js"
import { parse } from "./parser/bare-parser.js"

export * from "./ast/bare-ast-normalization.js"
export * from "./ast/bare-ast.js"
export * from "./code-gen/code-gen.js"
export * from "./core/config.js"
export * from "./parser/bare-parser-error.js"
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
export function compile(content: string, conf: Partial<Config> = {}): string {
    const completedConfig = Config(conf)
    const ast = parse(content, completedConfig)
    const normalizedAst = normalize(ast)
    return generate(normalizedAst, conf)
}
