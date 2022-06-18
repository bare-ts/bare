//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { CompilerError } from "../core/compiler-error.js"
import type { Config } from "../core/config.js"
import * as ast from "./bare-ast.js"

const LOWER_CAMEL_CASE_RE = /^[a-z][A-Za-z0-9]*$/
const UPPER_CAMEL_CASE_RE = /^[A-Z][A-Za-z0-9]*$/
const UPPER_SNAKE_CASE_RE = /^[A-Z][A-Z0-9_]*$/

export function checkSemantic(schema: ast.Ast, config: Config): ast.Ast {
    if (schema.defs.length === 0) {
        throw new CompilerError("a schema cannot be empty.", schema.loc)
    }
    const c = {
        config,
        symbols: ast.symbols(schema),
    }
    const aliases: Set<string> = new Set()
    for (const aliased of schema.defs) {
        const { alias, type } = aliased
        checkTypeName(aliased)
        if (aliases.has(alias)) {
            throw new CompilerError(
                `alias '${aliased.alias}' is already defined.`,
                aliased.loc,
            )
        }
        checkTypeInvariants(c, type)
        if (c.config.legacy) {
            checkCircularRef(c, type, new Set([alias]))
        } else {
            checkUsedBeforeDefined(c, type, aliases)
        }
        aliases.add(alias)
    }
    checkMainCodecs(c, schema)
    return schema
}

interface Checker {
    readonly config: Config
    readonly symbols: ast.SymbolTable
}

function checkTypeName(aliased: ast.AliasedType): void {
    const { alias, internal } = aliased
    if (alias.length !== 0 && /^\d/.test(alias[0])) {
        if (!internal) {
            throw new CompilerError(
                `the type name '${alias}' must not start with a figure or must be internal.`,
                aliased.loc,
            )
        }
    } else if (alias.length === 0 || !UPPER_CAMEL_CASE_RE.test(alias)) {
        throw new CompilerError(
            `the type name '${alias}' must be in UpperCamelCase.`,
            aliased.loc,
        )
    }
}

function checkMainCodecs(c: Checker, schema: ast.Ast): void {
    const rootAliases = ast.rootAliases(schema.defs)
    for (const alias of rootAliases) {
        const aliased = c.symbols.get(alias)
        if (aliased !== undefined) {
            const resolved = ast.resolveAlias(aliased.type, c.symbols)
            if (resolved.tag === "void") {
                throw new CompilerError(
                    `a root type must not resolve to void.`,
                    null,
                )
            }
        }
    }
}

function checkTypeInvariants(c: Checker, type: ast.Type): void {
    if (type.types !== null) {
        for (const subtype of type.types) {
            if (type.tag !== "union") {
                checkNonVoid(c, subtype)
            }
            checkTypeInvariants(c, subtype)
        }
    }
    switch (type.tag) {
        case "alias":
            checkUndefinedAlias(c, type)
            break
        case "data":
            checkLengthInvariants(type.data)
            break
        case "list":
            checkListInvariants(type)
            break
        case "map":
            checkMapInvariants(c, type)
            break
        case "enum":
        case "struct":
            checkMembersInvariants(c, type)
            break
        case "union":
            checkMembersInvariants(c, type)
            checkUnionInvariants(c, type)
            break
    }
}

function checkMembersInvariants(
    c: Checker,
    type: ast.EnumType | ast.StructType | ast.UnionType,
): void {
    const data = type.data
    if (data.length === 0) {
        throw new CompilerError(
            `a ${type.tag} must include at least one member.`,
            type.loc,
        )
    }
    if (type.types !== null && type.types.length !== data.length) {
        throw new CompilerError(
            "the number of types is not equal to the number of members. This is likely an internal error.",
            null,
        )
    }
    const names: Set<string> = new Set()
    const tags: Set<number> = new Set()
    let prevVal = -1
    for (const elt of data) {
        if (elt.name !== null) {
            if (type.tag === "enum" && !UPPER_SNAKE_CASE_RE.test(elt.name)) {
                throw new CompilerError(
                    "the name of an enum member must be in UPPER_SNAKE_CASE.",
                    elt.loc,
                )
            }
            if (type.tag === "struct" && !LOWER_CAMEL_CASE_RE.test(elt.name)) {
                throw new CompilerError(
                    "the name of a field must be in lowerCamelCase.",
                    elt.loc,
                )
            }
            if (names.has(elt.name)) {
                throw new CompilerError(
                    `name of a ${type.tag} member must be unique.`,
                    elt.loc,
                )
            }
            names.add(elt.name)
        }
        if (elt.val !== null) {
            if (!Number.isSafeInteger(elt.val)) {
                throw new CompilerError(
                    "only safe integers are supported.",
                    elt.loc,
                )
            }
            if (tags.has(elt.val)) {
                throw new CompilerError(
                    `tag '${elt.val}' is assigned to a preceding member.`,
                    elt.loc,
                )
            }
            tags.add(elt.val)
            if (c.config.pedantic && elt.val < prevVal) {
                throw new CompilerError(
                    `in pedantic mode, all ${type.tag} tags must be in order.`,
                    elt.loc,
                )
            }
            prevVal = elt.val
        }
    }
}

function checkLengthInvariants(len: ast.Length | null): void {
    if (len !== null && len.val <= 0) {
        throw new CompilerError(
            "a fixed list or data must have a length strictly greater than 0.",
            len.loc,
        )
    }
    if (len !== null && len.val >>> 0 !== len.val) {
        throw new CompilerError(
            "only length encoded as a u32 are supported.",
            len.loc,
        )
    }
}

function checkListInvariants(type: ast.ListType): void {
    checkLengthInvariants(type.data)
    if (type.extra !== null && type.extra.unique && type.extra.typedArray) {
        throw new CompilerError(
            "A list cannot be both typed (typedArray) and unique (Set).",
            type.loc,
        )
    }
    const valType = type.types[0]
    if (type.extra?.typedArray && !ast.isFixedNumericTag(valType.tag)) {
        throw new CompilerError(
            `value type of a typed array cannot be '${valType.tag}'. This is likely an internal error.`,
            valType.loc,
        )
    }
}

function checkMapInvariants(c: Checker, type: ast.MapType): void {
    const keyType = type.types[0]
    const resolvedKeyType = ast.resolveAlias(keyType, c.symbols)
    if (
        (!ast.isBaseTag(resolvedKeyType.tag) &&
            resolvedKeyType.tag !== "enum") ||
        resolvedKeyType.tag === "f32" ||
        resolvedKeyType.tag === "f64"
    ) {
        throw new CompilerError(
            "the key type must be a base type (except f32, f64) or an enum type.",
            keyType.loc,
        )
    }
}

function checkNonVoid(c: Checker, type: ast.Type): void {
    if (type.tag === "alias") {
        const aliased = c.symbols.get(type.data)
        type =
            aliased !== undefined
                ? ast.resolveAlias(aliased.type, c.symbols)
                : type
    }
    if (
        type.tag === "void" &&
        (type.extra === null ||
            type.extra.literal.type === "null" ||
            type.extra.literal.type === "undefined")
    ) {
        throw new CompilerError(
            `types that resolve to 'void' are only allowed in unions.`,
            type.loc,
        )
    }
}

function checkUnionInvariants(c: Checker, type: ast.UnionType): void {
    const tags = type.data
    // check type uniqueness
    const stringifiedTypes = new Set()
    for (let i = 0; i < tags.length; i++) {
        const stringifiedType = JSON.stringify(ast.withoutTrivia(type.types[i]))
        // NOTE: this dirty check is ok because we initialize
        // every object in the same way (properties are in the same order)
        if (stringifiedTypes.has(stringifiedType)) {
            throw new CompilerError(
                "a type cannot be repeated in an union.",
                type.types[i].loc,
            )
        }
        stringifiedTypes.add(stringifiedType)
    }
    // check that flat unions can be automatically flatten
    if (type.extra?.flat) {
        let isFlatUnion =
            type.types.every(ast.isBaseOrVoidType) &&
            ast.haveDistinctTypeof(type.types)
        if (
            !isFlatUnion &&
            type.types.every((t): t is ast.Alias => t.tag === "alias")
        ) {
            const resolved = type.types.map(
                (t) => c.symbols.get(t.data)?.type ?? t,
            )
            isFlatUnion =
                resolved.every(
                    (t): t is ast.StructType => t.tag === "struct",
                ) &&
                (resolved.every((t) => t.extra?.class) ||
                    ast.leadingDiscriminators(resolved) !== null)
        } else if (
            !isFlatUnion &&
            type.types.every((t): t is ast.StructType => t.tag === "struct")
        ) {
            isFlatUnion = ast.leadingDiscriminators(type.types) !== null
        }
        if (!isFlatUnion) {
            throw new CompilerError("the union cannot be flatten.", type.loc)
        }
    }
}

function checkUndefinedAlias(c: Checker, type: ast.Alias): void {
    if (!c.symbols.has(type.data)) {
        const alias = type.data
        throw new CompilerError(`alias '${alias}' is not defined.`, type.loc)
    }
}

function checkUsedBeforeDefined(
    c: Checker,
    type: ast.Type,
    defined: ReadonlySet<string>,
): void {
    if (type.tag === "alias" && !defined.has(type.data)) {
        throw new CompilerError(
            `Alias '${type.data}' is used before its definition. To allow use-before-definition and recursive types set the option '--legacy'.`,
            type.loc,
        )
    } else if (type.types !== null) {
        for (const subtype of type.types) {
            checkUsedBeforeDefined(c, subtype, defined)
        }
    }
}

function checkCircularRef(
    c: Checker,
    type: ast.Type,
    traversed: ReadonlySet<string>,
): void {
    if (
        (type.tag === "list" && type.data === null) ||
        type.tag === "map" ||
        type.tag === "optional"
    ) {
        return // allowed circular refs
    } else if (type.tag === "union") {
        let circularCount = 0
        let firstError: CompilerError | null = null
        for (const subtype of type.types) {
            try {
                checkCircularRef(c, subtype, traversed)
            } catch (e) {
                if (e instanceof CompilerError) {
                    firstError = firstError ?? e
                }
                circularCount++
            }
        }
        if (circularCount === type.types.length && firstError !== null) {
            throw firstError
        }
        return // allowed circular refs
    } else if (type.tag === "struct" || type.tag === "list") {
        for (const subtype of type.types) {
            checkCircularRef(c, subtype, traversed)
        }
    } else if (type.tag === "alias") {
        const alias = type.data
        if (traversed.has(alias)) {
            throw new CompilerError(
                "non-terminable circular references are not allowed.",
                type.loc,
            )
        }
        const aliased = c.symbols.get(alias)
        if (aliased !== undefined) {
            const subTraversed = new Set(traversed).add(alias)
            checkCircularRef(c, aliased.type, subTraversed)
        }
    }
}
