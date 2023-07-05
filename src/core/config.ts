//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

const DEFAULT_GENERATOR = "ts"

/**
 * @sealed
 */
export class ConfigError extends Error {
    override name = "ConfigError"
}

export type Config = {
    readonly generator: "bare" | "dts" | "js" | "ts"
    readonly legacy: boolean
    readonly lib: boolean
    /**
     * Output filename.
     * An empty string means inline output.
     *
     * If `generator` is unspecified, then the output filename extension is used
     * to determinate the generator.
     */
    readonly out: string | number | null
    readonly pedantic: boolean
    /**
     * Input filename.
     */
    readonly schema: string | number | null
    readonly useClass: boolean
    readonly useGenericArray: boolean
    readonly useIntEnum: boolean
    readonly useIntTag: boolean
    readonly useMutable: boolean
    readonly usePrimitiveFlatUnion: boolean
    readonly useSafeInt: boolean
    readonly useStructFlatUnion: boolean
    readonly useUndefined: boolean
}

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
