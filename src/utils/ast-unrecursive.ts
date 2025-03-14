//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import * as ast from "../ast.ts"
import { CompilerError } from "../core.ts"

// This file is separated from `ast` folder because these utils are used for
// facilitating code generation.

/**
 * A version of `type` that can be represented in _TypeScript_,
 * or `null` if it doesn't exists.
 *
 * @remarks
 * The returned type should only be used for type printing.
 * Some metadata may be inconsistent for other usages.
 */
export function unrecursive(
    type: ast.Type,
    symbols: ast.SymbolTable,
): ast.Type {
    const result = innerUnrecursive(type, symbols, new Set())
    if (result == null) {
        throw new CompilerError(
            "The recursive type cannot be simplified. This is likely an internal error. The recursive type may be invalid or the symbol table incomplete.",
            type.offset,
        )
    }
    return result
}

/**
 * @remarks
 * `traversed` contains all traversed aliases.
 */
function innerUnrecursive(
    type: ast.Type,
    symbols: ast.SymbolTable,
    traversed: ReadonlySet<string>,
): ast.Type | null {
    if (type.tag === "optional") {
        const simplified = innerUnrecursive(type.types[0], symbols, traversed)
        const extra = type.extra
        if (simplified == null) {
            return { tag: "void", data: null, types: null, extra, offset: 0 }
        }
        if (type.types[0] !== simplified) {
            return simplifyOptional({
                tag: "optional",
                data: null,
                types: [simplified],
                extra,
                offset: 0,
            })
        }
    } else if (type.tag === "alias") {
        const alias = type.data
        if (traversed.has(alias)) {
            return null
        }
        const aliased = symbols.get(alias)
        if (aliased != null) {
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
 * Simplified version of `type`.
 *
 * The simplification (recursively) flatten:
 *
 * - `optional<void>` to `void`
 * - `optional<optional<>>` to `optional<>`
 */
function simplifyOptional(type: ast.OptionalType): ast.Type {
    const subtype = type.types[0]
    if (subtype.tag === "void" || subtype.tag === "optional") {
        const literal = type.extra?.literal ?? ast.NULL_LITERAL_VAL
        const literal2 = subtype.extra?.literal ?? ast.NULL_LITERAL_VAL
        if (literal.type === literal2.type && literal.val === literal2.val) {
            const extra = { literal }
            if (subtype.types != null) {
                return simplifyOptional({
                    tag: "optional",
                    data: null,
                    types: subtype.types,
                    extra,
                    offset: 0,
                })
            }
            return { tag: "void", data: null, types: null, extra, offset: 0 }
        }
    }
    return type
}
