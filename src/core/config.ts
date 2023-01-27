//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

/**
 * @sealed
 */
export class ConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ConfigError"
    }
}

export type Config = {
    readonly generator: "bare" | "dts" | "js" | "ts"
    readonly importConfig: boolean
    readonly importFactory: boolean
    readonly legacy: boolean
    /**
     * Output filename.
     * An empty string means inline output.
     *
     * If `generator` is unspecified, then the output filename extension is used
     * to determinate the generator.
     */
    readonly out: string | number
    readonly pedantic: boolean
    /**
     * Input filename.
     * An empty string means inline input.
     */
    readonly schema: string | number
    readonly useClass: boolean
    readonly useFlatUnion: boolean
    readonly useGenericArray: boolean
    readonly useIntEnum: boolean
    readonly useMutable: boolean
    readonly useQuotedProperty: boolean
    readonly useSafeInt: boolean
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
    importConfig = false,
    importFactory = false,
    legacy = false,
    out = "",
    pedantic = false,
    schema = "",
    useClass = false,
    useFlatUnion = false,
    useGenericArray = false,
    useIntEnum = false,
    useMutable = false,
    useQuotedProperty = false,
    useSafeInt = false,
    useUndefined = false,
}: Partial<Config>): Config {
    if (
        typeof schema === "string" &&
        schema !== "" &&
        !schema.endsWith(".bare")
    ) {
        throw new ConfigError(
            "a file containing a BARE schema must end with extension '.bare'.",
        )
    }
    const inferredGenerator =
        typeof out === "string" && out.endsWith(".bare")
            ? "bare"
            : typeof out === "string" && out.endsWith(".d.ts")
            ? "dts"
            : typeof out === "string" && out.endsWith(".ts")
            ? "ts"
            : typeof out === "string" && out.endsWith(".js")
            ? "js"
            : (typeof out === "number" || out === "") && generator === undefined
            ? "ts"
            : generator
    if (generator !== undefined && inferredGenerator !== generator) {
        throw new ConfigError(
            `the inferred generator '${inferredGenerator}' from out '${out}' does not match the chosen generator '${generator}'.`,
        )
    }
    if (inferredGenerator === undefined) {
        throw new ConfigError(
            "the code generator to use cannot be determinate. Please set the option 'generator'.",
        )
    }
    return {
        generator: inferredGenerator,
        importConfig,
        importFactory,
        legacy,
        out,
        pedantic,
        schema,
        useClass,
        useFlatUnion,
        useGenericArray,
        useIntEnum,
        useMutable,
        useQuotedProperty,
        useSafeInt,
        useUndefined,
    }
}
