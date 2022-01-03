export interface CodeGenConfig {
    readonly importConfig: boolean
    readonly importFactory: boolean
    readonly main: string[]
    readonly generator: "dts" | "js" | "ts"
}

export function CodeGenConfig(part: Partial<CodeGenConfig>): CodeGenConfig {
    return Object.assign(
        {
            importConfig: false,
            importFactory: false,
            main: [],
            generator: "ts",
        },
        part
    )
}
