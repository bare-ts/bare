//! Copyright (c) 2022 Victorien Elvinger
//! Licensed under the MIT License (https://mit-license.org/)

export const ALL_CASE_RE = /^\w+$/
export const CAMEL_CASE_RE = /^[a-z][A-Za-z\d]*$/
export const CONSTANT_CASE_RE = /^[A-Z][A-Z\d_]*$/
export const PASCAL_CASE_RE = /^[A-Z][A-Za-z\d]*$/

export function capitalize(s: string): string {
    return s.replace(/^./, (c) => c.toUpperCase())
}

export function softSpace(s: string): string {
    return s[0] === "\n" ? s : ` ${s}`
}

export function jsDoc(content: string): string {
    if (content === "") {
        return ""
    }
    const docBody = content.replace(/\n/g, "\n *")
    return `/**\n *${docBody}/\n`
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

const NON_EMPTY_LINE_DELIM = /\n(?!\r|\n)/g
const INDENTATION = /\n[^\S\r\n]*(?!\s)/g
const LEADING_NEWLINE = /^\r?\n/
const TRAILING_INDENTATION = /\r?\n[^\S\n]*$/
const SPACE_ONLY_LINE = /\n[^\S\r\n]+(?=\r|\n)/g

export function dent(
    chunks: TemplateStringsArray,
    ...values: readonly unknown[]
): string {
    const lastChunkIndex = chunks.length - 1
    assert(values.length === lastChunkIndex, "")
    assert(
        chunks.every((chunk) => chunk != null),
        "invalid escape sequence are not permitted",
    )
    assert(LEADING_NEWLINE.test(chunks[0]), "must start with an empty newline")
    assert(
        TRAILING_INDENTATION.test(chunks[chunks.length - 1]),
        "must end with a space-only line",
    )
    assert(
        chunks.every((chunk) => !SPACE_ONLY_LINE.test(chunk)),
        "lines that contain only spaces are not permitted",
    )
    let result = ""
    let lastIndentation = "\n"
    let commonIndentation = ""
    for (let i = 0; i <= lastChunkIndex; i++) {
        assert(chunks[i] != null, "wrong escape sequence")
        if (i > 0) {
            // Indent interpolated values.
            result += String(values[i - 1]).replace(
                NON_EMPTY_LINE_DELIM,
                lastIndentation,
            )
        }
        result += chunks[i]
        const matches = chunks[i].match(INDENTATION)
        if (matches != null) {
            if (i === lastChunkIndex) {
                // Remove the mandatory and stripped trailing newline.
                matches.pop()
            }
            for (const match of matches) {
                assert(
                    commonIndentation.startsWith(match) ||
                        match.startsWith(commonIndentation),
                    "",
                )
                if (
                    match.length < commonIndentation.length ||
                    commonIndentation.length === 0
                ) {
                    commonIndentation = match
                }
                lastIndentation = match
            }
        }
    }
    if (commonIndentation.length > 1) {
        result = result.replaceAll(commonIndentation, "\n")
    }
    return result.replace(LEADING_NEWLINE, "").replace(TRAILING_INDENTATION, "")
}

function assert(x: boolean, msg: string): asserts x {
    if (!x) {
        throw new Error(msg)
    }
}
