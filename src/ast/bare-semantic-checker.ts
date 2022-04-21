//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

import { CompilerError } from "../core/compiler-error.js"
import type { Config } from "../core/config.js"
import * as ast from "./bare-ast.js"

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
        if (aliases.has(alias)) {
            throw new CompilerError(
                `alias '${alias}' is already defined.`,
                aliased.loc
            )
        }
        aliases.add(alias)
        checkAliasedInvariants(aliased)
        checkTypeInvariants(c, type)
        checkCircularRef(c, type, new Set([alias]))
    }
    checkMainCodecs(c, schema)
    return schema
}

interface Checker {
    readonly config: Config
    readonly symbols: ast.SymbolTable
}

function checkMainCodecs(c: Checker, schema: ast.Ast): void {
    for (const alias of schema.main) {
        const aliased = c.symbols.get(alias)
        if (aliased === undefined) {
            throw new CompilerError(
                `main codec '${alias}' does not exist.`,
                null
            )
        } else if (aliased.internal) {
            throw new CompilerError(
                `main codec '${alias}' must be exported.`,
                null
            )
        } else {
            const resolved = ast.resolveAlias(aliased.type, c.symbols)
            if (resolved.tag === "void") {
                throw new CompilerError(
                    `main codec '${alias}' must not be resolved to void type.`,
                    null
                )
            }
        }
    }
}

function checkAliasedInvariants(aliased: ast.AliasedType): void {
    if (aliased.type.tag === "literal") {
        throw new CompilerError(
            "a literal type cannot be aliased.",
            aliased.loc
        )
    }
}

function checkTypeInvariants(c: Checker, type: ast.Type): void {
    switch (type.tag) {
        case "alias":
            checkUndefinedAlias(c, type)
            break
        case "data":
        case "list":
        case "set":
        case "typedarray":
            checkLengthInvariants(type.props.len)
            break
        case "enum":
            checkEnumInvariants(c, type)
            break
        case "map":
            checkMapInvariants(c, type)
            break
        case "struct":
            checkStructInvariants(type)
            break
        case "union":
            checkUnionInvariants(c, type)
            break
    }
    if (type.types !== null) {
        for (const subtype of type.types) {
            if (type.tag !== "union") {
                checkNonVoid(c, subtype)
            }
            checkTypeInvariants(c, subtype)
        }
    }
}

function checkEnumInvariants(c: Checker, type: ast.EnumType): void {
    if (type.props.vals.length === 0) {
        throw new CompilerError(
            "an enum must include at least one member.",
            type.loc
        )
    }
    const valNames: Set<string> = new Set()
    const tagVals: Set<number> = new Set()
    let prevVal = -1
    for (const enumVal of type.props.vals) {
        if (valNames.has(enumVal.name)) {
            throw new CompilerError(
                "the name of an enum member must be unique.",
                enumVal.loc
            )
        }
        if (!Number.isSafeInteger(enumVal.val)) {
            throw new CompilerError(
                "only enum values encoded as safe integers are supported.",
                enumVal.loc
            )
        }
        if (tagVals.has(enumVal.val)) {
            throw new CompilerError(
                `value '${enumVal.val}' is assigned to a preceding member.`,
                enumVal.loc
            )
        }
        if (c.config.pedantic && enumVal.val < prevVal) {
            throw new CompilerError(
                "in pedantic mode, all enum values must be in order.",
                enumVal.loc
            )
        }
        valNames.add(enumVal.name)
        tagVals.add(enumVal.val)
        prevVal = enumVal.val
    }
}

function checkLengthInvariants(len: ast.Integer | null): void {
    if (len !== null && len.val <= 0) {
        throw new CompilerError(
            "a fixed list or data must have a length strictly greater than 0.",
            len.loc
        )
    }
    if (len !== null && len.val >>> 0 !== len.val) {
        throw new CompilerError(
            "only length encoded as a u32 are supported.",
            len.loc
        )
    }
}

function checkMapInvariants(c: Checker, type: ast.MapType): void {
    const keyType = type.types[0]
    const resolvedKeyType = ast.resolveAlias(keyType, c.symbols)
    if (!ast.isBaseTag(resolvedKeyType.tag) && resolvedKeyType.tag !== "enum") {
        throw new CompilerError(
            "the key type must be a base type or an enum type.",
            keyType.loc
        )
    }
}

function checkNonVoid(c: Checker, type: ast.Type): void {
    if (type.tag === "alias") {
        const aliased = c.symbols.get(type.props.alias)
        type =
            aliased !== undefined
                ? ast.resolveAlias(aliased.type, c.symbols)
                : type
    }
    if (type.tag === "void") {
        throw new CompilerError(
            `types that resolve to 'void' are only allowed in unions.`,
            type.loc
        )
    }
}

function checkStructInvariants(type: ast.StructType): void {
    if (type.props.fields.length === 0) {
        throw new CompilerError(
            "a struct must include at least one member.",
            type.loc
        )
    }
    if (type.types.length !== type.props.fields.length) {
        throw new CompilerError(
            "the number of fields is not equal to the number of registered types. This is likely an internal error.",
            null
        )
    }
    const fieldNames: Set<string> = new Set()
    for (const field of type.props.fields) {
        if (fieldNames.has(field.name)) {
            throw new CompilerError(
                "the name of a field must be unique.",
                field.loc
            )
        }
        fieldNames.add(field.name)
    }
}

function checkUnionInvariants(c: Checker, type: ast.UnionType): void {
    if (type.types.length === 0) {
        throw new CompilerError(
            "a union must include at least one type.",
            type.loc
        )
    }
    if (type.types.length !== type.props.tags.length) {
        throw new CompilerError(
            "the number of tags is not equal to the number of types of the union. This is likely an internal error.",
            null
        )
    }
    for (let i = 0; i < type.types.length; i++) {
        const tag = type.props.tags[i]
        if (!Number.isSafeInteger(tag.val)) {
            throw new CompilerError(
                "only tags encoded as safe integer are supported.",
                tag.loc
            )
        }
    }
    // check type uniqueness
    const stringifiedTypes = new Set()
    const tagVals: Set<number> = new Set()
    let prevTagVal = -1
    for (let i = 0; i < type.props.tags.length; i++) {
        const tag = type.props.tags[i]
        if (tagVals.has(tag.val)) {
            throw new CompilerError(
                `tag '${tag.val}' is assigned to a preceding type.`,
                tag.loc
            )
        }
        if (c.config.pedantic && tag.val < prevTagVal) {
            throw new CompilerError(
                "in pedantic mode, all tags must be in order.",
                tag.loc
            )
        }
        tagVals.add(tag.val)
        prevTagVal = tag.val
        const stringifiedType = JSON.stringify(ast.withoutLoc(type.types[i]))
        // NOTE: this dirty check is ok because we initialize
        // every object in the same way (properties are in the same order)
        if (stringifiedTypes.has(stringifiedType)) {
            throw new CompilerError(
                "a type cannot be repeated in an union.",
                type.types[i].loc
            )
        }
        stringifiedTypes.add(stringifiedType)
    }
    // check that flat unions can be automatically flatten
    if (type.props.flat) {
        let isFlatUnion =
            type.types.every(ast.isBaseOrVoidType) &&
            ast.haveDistinctTypeof(type.types)
        if (!isFlatUnion && type.types.every((t) => t.tag === "alias")) {
            const resolved = type.types.map((t) =>
                ast.resolveAlias(t, c.symbols)
            )
            if (
                type.types.length === new Set(resolved).size &&
                resolved.every((t): t is ast.StructType => t.tag === "struct")
            ) {
                // every struct is unique (no double aliasing)
                isFlatUnion = resolved.every((t) => t.props.class)
                if (!isFlatUnion) {
                    isFlatUnion = ast.leadingDiscriminators(resolved) !== null
                }
            }
        }
        if (!isFlatUnion) {
            throw new CompilerError("the union cannot be flatten.", type.loc)
        }
    }
}

function checkUndefinedAlias(c: Checker, type: ast.Alias): void {
    if (!c.symbols.has(type.props.alias)) {
        const alias = type.props.alias
        throw new CompilerError(`alias '${alias}' is not defined.`, type.loc)
    }
}

function checkCircularRef(
    c: Checker,
    type: ast.Type,
    traversed: ReadonlySet<string>
): void {
    if (
        ((type.tag === "list" || type.tag === "set") &&
            type.props.len === null) ||
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
    } else if (
        type.tag === "struct" ||
        type.tag === "list" ||
        type.tag === "set"
    ) {
        for (const subtype of type.types) {
            checkCircularRef(c, subtype, traversed)
        }
    } else if (type.tag === "alias") {
        const alias = type.props.alias
        if (traversed.has(type.props.alias)) {
            throw new CompilerError(
                "non-terminable circular references are not allowed.",
                type.loc
            )
        }
        const aliased = c.symbols.get(alias)
        if (aliased !== undefined) {
            const subTraversed = new Set(traversed).add(alias)
            checkCircularRef(c, aliased.type, subTraversed)
        }
    }
}
