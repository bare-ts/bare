//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

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
