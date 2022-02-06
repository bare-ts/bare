export class ConfigError extends Error {
    declare readonly name: "ConfigError"

    constructor(message: string) {
        super(message)
        this.name = "ConfigError"
    }
}

export interface Config {
    readonly generator: "dts" | "js" | "ts"
    readonly importConfig: boolean
    readonly importFactory: boolean
    readonly main: readonly string[]
    readonly out: string | number
    readonly schema: string | number
    readonly useClass: boolean
    readonly useFlatUnion: boolean
    readonly useGenericArray: boolean
    readonly useIntEnum: boolean
    readonly useLaxOptional: boolean
    readonly useMutable: boolean
    readonly useNull: boolean
    readonly useSafeInt: boolean
}

/**
 * @param {Partial<Config>} part
 * @returns {Config} completed config
 * @throws {ConfigError} when the code generator cannot be determinate or
 *  when the schema format is not a supported.
 */
export function Config({
    generator = undefined,
    importConfig = false,
    importFactory = false,
    main = [],
    out = "",
    schema = "",
    useClass = false,
    useFlatUnion = false,
    useGenericArray = false,
    useIntEnum = false,
    useLaxOptional = false,
    useMutable = false,
    useNull = false,
    useSafeInt = false,
}: Partial<Config>): Config {
    if (
        typeof schema === "string" &&
        schema !== "" &&
        !schema.endsWith(".bare")
    ) {
        throw new ConfigError(
            "a file containing a BARE schema must end with extension '.bare'."
        )
    }
    const inferredGenerator =
        typeof out === "string" && out.endsWith(".d.ts")
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
            `the inferred generator '${inferredGenerator}' from out '${out}' does not match the chosen generator '${generator}'.`
        )
    }
    if (inferredGenerator === undefined) {
        throw new ConfigError(
            "the code generator to use cannot be determinate. Please set the option 'generator'."
        )
    }
    return {
        generator: inferredGenerator,
        importConfig,
        importFactory,
        main,
        out,
        schema,
        useClass,
        useFlatUnion,
        useGenericArray,
        useIntEnum,
        useLaxOptional,
        useMutable,
        useNull,
        useSafeInt,
    }
}
