//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import type * as ast from "../ast/bare-ast.js"
import { CompilerError } from "../core/compiler-error.js"

// This file is separated from ast folder because these utils are used for
// facilitating code generation.

/**
 *
 * @param type
 * @param symbols
 * @returns a version of `type` that is a valid TypeScript type. Null otherwise.
 *  The returned type should only be used for type printing.
 *  Some metadata may be inconsistent for other usages.
 */
export function unrecursive(
    type: ast.Type,
    symbols: ast.SymbolTable,
): ast.Type {
    const result = innerUnrecursive(type, symbols, new Set())
    if (result === null) {
        throw new CompilerError(
            "The recursive type cannot be simplified. This is likely an internal error. The recursive type may be invalid or the symbol table incomplete.",
            type.loc,
        )
    }
    return result
}

/**
 *
 * @param type
 * @param symbols
 * @param traversed traversed aliases
 * @returns a version of `type` that is a valid TypeScript type. Null otherwise.
 *  The returned type should only be used for type printing.
 *  Some metadata may be inconsistent for other usages.
 */
function innerUnrecursive(
    type: ast.Type,
    symbols: ast.SymbolTable,
    traversed: ReadonlySet<string>,
): ast.Type | null {
    if (type.tag === "optional") {
        const simplified = innerUnrecursive(type.types[0], symbols, traversed)
        const props = type.props
        if (simplified === null) {
            return { tag: "void", props, types: null, loc: null }
        } else if (type.types[0] !== simplified) {
            return simplifyOptional({
                tag: "optional",
                props,
                types: [simplified],
                loc: null,
            })
        }
    } else if (type.tag === "alias") {
        const alias = type.props.alias
        if (traversed.has(type.props.alias)) {
            return null
        }
        const aliased = symbols.get(alias)
        if (aliased !== undefined) {
            const subTraversed = new Set(traversed).add(alias)
            const simplified = innerUnrecursive(
                aliased.type,
                symbols,
                subTraversed,
            )
            if (aliased.type !== simplified) {
                return simplified
            }
        }
    }
    return type
}

/**
 * Flatten optional<void> to void and
 * recursively optional<optional<>> to optional<>
 *
 * @param type
 * @returns simplified version of `type`.
 *  If `type` cannot be simplified, then returns `type`.
 */
function simplifyOptional(type: ast.OptionalType): ast.Type {
    const subtype = type.types[0]
    if (subtype.tag === "void" || subtype.tag === "optional") {
        const lax =
            type.props.lax ||
            subtype.props.lax ||
            type.props.undef !== subtype.props.undef
        const undef = type.props.undef && subtype.props.undef
        const props = { lax, undef }
        if (subtype.tag === "void") {
            return { tag: "void", props, types: null, loc: null }
        } else if (subtype.tag === "optional") {
            return simplifyOptional({
                tag: "optional",
                props,
                types: subtype.types,
                loc: null,
            })
        }
    }
    return type
}
