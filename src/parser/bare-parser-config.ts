export interface BareParserConfig {
    readonly useClass: boolean
    readonly useFlatUnion: boolean
    readonly useGenericArray: boolean
    readonly useIntEnum: boolean
    readonly useMutable: boolean
    readonly useNull: boolean
    readonly useLaxOptional: boolean
    readonly useSafeInt: boolean
}

export function BareParserConfig(
    part: Partial<BareParserConfig>
): BareParserConfig {
    return Object.assign(
        {
            useClass: false,
            useFlatUnion: false,
            useGenericArray: false,
            useIntEnum: false,
            useMutable: false,
            useNull: false,
            useLaxOptional: false,
            useSafeInt: false,
        },
        part
    )
}
