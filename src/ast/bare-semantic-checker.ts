import { CompilerError } from "../core/compiler-error.js"
import * as ast from "./bare-ast.js"

export function checkSemantic(schema: ast.Ast): ast.Ast {
    if (schema.defs.length === 0) {
        throw new CompilerError("a schema cannot be empty.", schema.loc)
    }
    const symbols = ast.symbols(schema)
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
        checkTypeInvariants(type, symbols)
        checkCircularRef(type, symbols, new Set([alias]))
    }
    return schema
}

function checkTypeInvariants(type: ast.Type, symbols: ast.SymbolTable): void {
    switch (type.tag) {
        case "alias":
            checkUndefinedAlias(type, symbols)
            break
        case "enum":
            checkEnumInvariants(type)
            break
        case "map":
            checkMapInvariants(type)
            break
        case "struct":
            checkStructInvariants(type)
            break
        case "union":
            checkUnionInvariants(type)
            break
    }
    if (type.types != null) {
        for (const subtype of type.types) {
            if (type.tag !== "union") {
                checkNonVoid(subtype, symbols)
            }
            checkTypeInvariants(subtype, symbols)
        }
    }
}

function checkEnumInvariants(type: ast.EnumType): void {
    if (type.props.vals.length === 0) {
        throw new CompilerError(
            "an enum must include at least one member.",
            type.loc
        )
    }
    const valNames: Set<string> = new Set()
    const tagVals: Set<number> = new Set()
    for (const enumVal of type.props.vals) {
        if (valNames.has(enumVal.name)) {
            throw new CompilerError(
                "the name of an enum member must be unique.",
                enumVal.loc
            )
        }
        if (tagVals.has(enumVal.val)) {
            throw new CompilerError(
                `value '${enumVal.val}' is assigned to a preceding member.`,
                enumVal.loc
            )
        }
        valNames.add(enumVal.name)
        tagVals.add(enumVal.val)
    }
}

function checkMapInvariants(type: ast.MapType): void {
    const keyType = type.types[0]
    if (!ast.isPrimitiveTag(keyType.tag) || keyType.tag === "void") {
        throw new CompilerError(
            "the key type must be a primitive type.",
            keyType.loc
        )
    }
}

function checkNonVoid(type: ast.Type, symbols: ast.SymbolTable): void {
    if (type.tag === "alias") {
        const aliased = symbols.get(type.props.alias)
        type =
            aliased !== undefined
                ? ast.resolveAlias(aliased.type, symbols)
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

function checkUnionInvariants(type: ast.UnionType): void {
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
    const stringifiedTypes = new Set()
    const tagVals: Set<number> = new Set()
    for (let i = 0; i < type.props.tags.length; i++) {
        const tagVal = type.props.tags[i]
        if (tagVals.has(tagVal)) {
            throw new CompilerError(
                `tag '${tagVal}' is assigned to a preceding type.`,
                type.types[i].loc
            )
        }
        tagVals.add(tagVal)
        const stringifiedType = JSON.stringify(type.types[i])
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
}

function checkUndefinedAlias(type: ast.Alias, symbols: ast.SymbolTable): void {
    if (!symbols.has(type.props.alias)) {
        const alias = type.props.alias
        throw new CompilerError(`alias '${alias}' is not defined.`, type.loc)
    }
}

function checkCircularRef(
    type: ast.Type,
    symbols: ast.SymbolTable,
    traversed: Set<string>
): void {
    if (type.tag === "alias") {
        const alias = type.props.alias
        if (traversed.has(type.props.alias)) {
            throw new CompilerError(
                "circular references are not allowed.",
                type.loc
            )
        }
        const aliased = symbols.get(alias)
        if (aliased != null) {
            const subTraversed = new Set(traversed).add(alias)
            checkCircularRef(aliased.type, symbols, subTraversed)
        }
    }
    if (type.types != null) {
        for (const subtype of type.types) {
            if (type.tag === "struct") {
                checkStructFieldCircularRef(subtype, symbols, traversed)
            } else {
                checkCircularRef(subtype, symbols, traversed)
            }
        }
    }
}

/**
 *
 * @param fieldType
 * @param symbols
 * @param traversed
 * @throws CompilerError if a forbidden circular reference is discovered.
 */
function checkStructFieldCircularRef(
    fieldType: ast.Type,
    symbols: ast.SymbolTable,
    traversed: Set<string>
): void {
    if (
        fieldType.tag === "array" ||
        fieldType.tag === "map" ||
        fieldType.tag === "optional" ||
        fieldType.tag === "set"
    ) {
        return // allowed circular refs
    }
    if (fieldType.tag === "union") {
        let circularCount = 0
        let firstCycle: ast.Type | null = null
        for (const subtype of fieldType.types) {
            try {
                checkCircularRef(subtype, symbols, traversed)
            } catch (e) {
                firstCycle = firstCycle ?? subtype
                circularCount++
            }
        }
        if (circularCount === fieldType.types.length && firstCycle != null) {
            throw new CompilerError(
                "circular references are not allowed.",
                firstCycle.loc
            )
        }
        return // allowed circular refs
    }
    checkCircularRef(fieldType, symbols, traversed)
}
