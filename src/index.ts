import { normalize } from "./ast/bare-ast-normalization.js"
import type { CodeGenConfig } from "./code-gen/code-gen-config.js"
import { generate } from "./code-gen/code-gen.js"
import type { BareParserConfig } from "./parser/bare-parser-config.js"
import { parse } from "./parser/bare-parser.js"

export * from "./ast/bare-ast-normalization.js"
export * from "./ast/bare-ast.js"
export * from "./code-gen/bare-config-error.js"
export * from "./code-gen/code-gen-config.js"
export * from "./code-gen/code-gen.js"
export * from "./parser/bare-parser-config.js"
export * from "./parser/bare-parser-error.js"
export * from "./parser/bare-parser.js"
export * from "./parser/lex.js"

/**
 *
 * @param content
 * @param filename
 * @param parserConfig
 * @param codeGenConfig
 * @throw BareParserError upon parsing error
 * @throw BareConfigError upon error in parser or code-gen config
 * @return code
 */
export function compile(
    content: string,
    filename: string,
    config: Partial<BareParserConfig> & Partial<CodeGenConfig>
): string {
    const ast = parse(content, filename, config)
    const normalizedAst = normalize(ast)
    return generate(normalizedAst, config)
}
