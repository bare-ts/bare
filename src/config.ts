//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

import { ConfigError } from "./errors.ts"

export type Config = {
    /**
     * Output generator
     */
    readonly generator: "bare" | "dts" | "js" | "ts"
    /**
     * Allow legacy BARE syntax and features.
     * This affects the parsing of BARE schema.
     */
    readonly legacy: boolean
    /**
     * Don't generate decoders and encoders of root types.
     */
    readonly lib: boolean
    /**
     * Output filename.
     * An empty string means inline output.
     *
     * If `generator` is unspecified, then the output filename extension is used
     * to determinate the generator.
     */
    readonly out: string | number | null
    /**
     * Enforce the following extra constraints and
     * raise a CompilerError if they are not followed.
     *
     * - Require enum and union types to set all tag values.
     * - Require struct field names to be in `camelCase` or `snake_case`,
     *   forbid `mixed_Case`.
     */
    readonly pedantic: boolean
    /**
     * Input filename.
     * This is only used for reporting the location of compiler errors.
     */
    readonly schema: string | number | null
    /**
     * Use classes instead of object types for structs.
     */
    readonly useClass: boolean
    /**
     * Don't use typed arrays for lists of numbers.
     */
    readonly useGenericArray: boolean
    /**
     * Use integers for enum values instead of strings.
     */
    readonly useIntEnum: boolean
    /**
     * Use integers for union tags instead of strings.
     */
    readonly useIntTag: boolean
    /**
     * Don't use the `readonly` keyword.
     */
    readonly useMutable: boolean
    /**
     * Use regular unions for distinct primitive types.
     */
    readonly usePrimitiveFlatUnion: boolean
    /**
     * Use `number` instead of `bigint` for u64-like types.
     */
    readonly useSafeInt: boolean
    /**
     * Embed tags in structs directly for struct unions.
     */
    readonly useStructFlatUnion: boolean
    /**
     * Use `undefined` instead of `null` for optional types.
     */
    readonly useUndefined: boolean
}

const DEFAULT_GENERATOR = "ts"

/**
 * Complete the configuration by setting missing fields to their default values.
 *
 * @throws {@link ConfigError} if the code generator cannot be determinate or
 * the format of the schema is not a supported.
 */
export function Config({
    generator,
    legacy = false,
    lib = false,
    out = null,
    pedantic = false,
    schema = null,
    useClass = false,
    useGenericArray = false,
    useIntEnum = false,
    useIntTag = false,
    useMutable = false,
    usePrimitiveFlatUnion = false,
    useSafeInt = false,
    useStructFlatUnion = false,
    useUndefined = false,
}: Partial<Config>): Config {
    if (typeof schema === "string" && !schema.endsWith(".bare")) {
        throw new ConfigError(
            "a file containing a BARE schema must end with extension '.bare'.",
        )
    }
    const inferredGenerator =
        typeof out === "string"
            ? out.endsWith(".bare")
                ? "bare"
                : out.endsWith(".d.ts")
                  ? "dts"
                  : out.endsWith(".ts")
                    ? "ts"
                    : out.endsWith(".js")
                      ? "js"
                      : generator
            : generator == null && (typeof out === "number" || out == null)
              ? DEFAULT_GENERATOR
              : generator
    if (generator != null && inferredGenerator !== generator) {
        throw new ConfigError(
            `the inferred generator '${inferredGenerator}' from out '${out}' does not match the chosen generator '${generator}'.`,
        )
    }
    if (inferredGenerator == null) {
        throw new ConfigError(
            "the code generator to use cannot be determinate. Please set the option 'generator'.",
        )
    }
    return {
        generator: inferredGenerator,
        legacy,
        lib,
        out,
        pedantic,
        schema,
        useClass,
        useGenericArray,
        useIntEnum,
        useIntTag,
        useMutable,
        usePrimitiveFlatUnion,
        useSafeInt,
        useStructFlatUnion,
        useUndefined,
    }
}
