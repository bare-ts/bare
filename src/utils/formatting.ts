//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

export const ALL_CASE_RE = /^\w+$/
export const CAMEL_CASE_RE = /^[a-z][A-Za-z\d]*$/
export const CONSTANT_CASE_RE = /^[A-Z][A-Z\d_]*$/
export const NUMBER_RE = /^\d+$/
export const PASCAL_CASE_RE = /^[A-Z][A-Za-z\d]*$/

export function capitalize(s: string): string {
    return s.replace(/^./, (c) => c.toUpperCase())
}

export function indent(s: string, n = 1): string {
    return s.replace(/\n/g, "\n" + "    ".repeat(n))
}

export function unindent(s: string, n = 1): string {
    return s.replace(new RegExp(`\n[ ]{${4 * n}}`, "g"), "\n")
}

export function softSpace(s: string): string {
    return s[0] === "\n" ? s : ` ${s}`
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

export function toCamelCase(s: string): string {
    return normalize(s)
        .toLowerCase()
        .replace(/_./g, (m0) => m0[1].toUpperCase())
}

export function toPascalCase(s: string): string {
    return capitalize(toCamelCase(s))
}

export function toConstantCase(s: string): string {
    return normalize(s).toUpperCase()
}

function normalize(s: string): string {
    return s
        .replace(/\B[A-Z][a-z\d]/g, (m0) => `_${m0}`)
        .replace(/[-_ ]+/g, "_")
}
