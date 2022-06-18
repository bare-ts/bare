//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under Apache License 2.0 (https://apache.org/licenses/LICENSE-2.0)

export function capitalize(s: string): string {
    return s.replace(/^\w/, (c) => c.toUpperCase())
}

export function indent(s: string, n = 1): string {
    return s.replace(/\n/g, "\n" + "    ".repeat(n))
}

export function unindent(s: string, n = 1): string {
    return s.replace(new RegExp(`\n[ ]{${4 * n}}`, "g"), "\n")
}

export function jsDoc(content: string | null): string {
    if (content === null) {
        return ""
    }
    const docBody = content.trimEnd().split("\n").join("\n *")
    return `/**\n *${docBody}\n */\n`
}

export function jsRpr(v: unknown): string {
    return typeof v === "string"
        ? `"${v}"`
        : typeof v === "bigint"
        ? `${v}n`
        : `${v}`
}

export function underscoreCase(camelCase: string): string {
    const result = camelCase.replace(/([A-Z])/g, "_$1").toUpperCase()
    return result[0] === "_" ? result.slice(1) : result
}
