
## Primitive types

| BARE type    | CLI option       | TS type       | Binary representation            |
|--------------|------------------|---------------|----------------------------------|
| `bool`       |                  | `boolean`     | 0: false, 1: true                |
| `f32`        |                  | `number`      | single-precision float           |
| `f64`        |                  | `number`      | double-precision float           |
| `i8`         |                  | `number`      | 8 bits signed integer            |
| `i16`        |                  | `number`      | 16 bits signed integer           |
| `i32`        |                  | `number`      | 32 bits signed integer           |
| `i64`        |                  | `bigint`      | 64 bits signed integer           |
| `i64`        | `--use-safe-int` | `number`      | 64 bits signed integer           |
| `int`        |                  | `bigint`      | variable-length signed integer   |
| `int`        | `--use-safe-int` | `number`      | variable-length signed integer   |
| `u8`         |                  | `number`      | 8 bits unsigned integer          |
| `u16`        |                  | `number`      | 16 bits unsigned integer         |
| `u32`        |                  | `number`      | 32 bits unsigned integer         |
| `u64`        |                  | `bigint`      | 64 bits unsigned integer         |
| `u64`        | `--use-safe-int` | `number`      | 64 bits unsigned integer         |
| `uint`       |                  | `bigint`      | variable-length unsigned integer |
| `uint`       | `--use-safe-int` | `number`      | variable-length unsigned integer |
| `str`        |                  | `string`      | length-prefixed UTF-8 string     |
| `data`       |                  | `Uint8Array`  | length-prefixed blob of data     |
| `data[len]`  |                  | `Uint8Array`  | fixed-length blob of data        |

All primitive types ensure a bijective encoding, but `str`, `f32`, and `f64`.
If you wish to support use-cases such as message deduplication,
then you should take care to normalize your strings and floats (NaNs).

## Arrays

| BARE type      | CLI option      | TS type        | Binary representation                         |
|----------------|-----------------|----------------|-----------------------------------------------|
| `list<T>`      |                 | `readonly T[]` | length-prefixed sequence of value of type `T` |
| `list<T>`      | `--use-mutable` | `T[]`          | length-prefixed sequence of value of type `T` |
| `list<T>[len]` |                 | `readonly T[]` | fixed-length sequence of value of type `T`    |
| `list<T>[len]` | `--use-mutable` | `T[]`          | fixed-length sequence of value of type `T`    |

If the option `--use-generic-array` is not set,
then _bare-ts_ uses corresponding typed arrays:

| BARE type                     | TS type          |
|-------------------------------|------------------|
| `list<i8>`, `list<i8>[len]`   | `Int8Array`      |
| `list<i16>`, `list<i16>[len]` | `Int16Array`     |
| `list<i32>`, `list<i32>[len]` | `Int32Array`     |
| `list<i64>`, `list<i64>[len]` | `BigInt64Array`  |
| `list<u8>`, `list<u8>[len]`   | `Uint8Array`     |
| `list<u16>`, `list<u16>[len]` | `Uint16Array`    |
| `list<u32>`, `list<u32>[len]` | `Uint32Array`    |
| `list<u64>`, `list<u64>[len]` | `BigUint64Array` |

# Map

| BARE type      | CLI option      | TS type             |
|----------------|-----------------|---------------------|
| `map<K><V>`    |                 | `ReadonlyMap<K, V>` |
| `map<K><V>`    | `--use-mutable` | `Map<K, V>`         |

## Optional

| BARE type     | CLI option        | TS type         | Binary representation       |
|---------------|-------------------|-----------------|-----------------------------|
| `optional<T>` |                   | `T \| null`      | Value tagged with a boolean |
| `optional<T>` | `--use-undefined` | `T \| undefined` | Value tagged with a boolean |

## Enum

| BARE type              | CLI option       | TS type                       | Binary representation |
|------------------------|------------------|-------------------------------|-----------------------|
| `enum { A, B }`        |                  | `"A" \| "B"`                  | integer `0` or `1`    |
| `enum { A, B }`        | `--use-int-enum` | `0 \| 1`                      | integer `0` or `1`    |
| `type E enum { A, B }` |                  | `enum E { A = "A", B = "B" }` | integer `0` or `1`    |
| `type E enum { A, B }` | `--use-int-enum` | `enum E { A = 0, B = 1 }`     | integer `0` or `1`    |

## Struct

| BARE type                 | CLI option      | TS type                                                  |
|---------------------------|-----------------|----------------------------------------------------------|
| `struct { p: u8 }`        |                 | `{ readonly a: number }`                                 |
| `struct { p: u8 }`        | `--use-class`   | `{ readonly a: number }`                                 |
| `struct { p: u8 }`        | `--use-mutable` | `{ a: number }`                                          |
| `type S struct { p: u8 }` |                 | `type S = { readonly a: number }`                        |
| `type S struct { p: u8 }` | `--use-class`   | `class S { readonly a: number; constructor(a: number) }` |

# Union

| BARE type             | CLI option                   | TS type                                            |
|-----------------------|------------------------------|----------------------------------------------------|
| `union { T1 \| T2 }`  |                              | `{ tag: "T1", val: T1 } \| { tag: "T2", val: T2 }` |
| `union { T1 \| T2 }`  | `--use-int-tag`              | `{ tag: 0, val: T1 } \| { tag: 1, val: T2 }`       |
| `union { str \| u8 }` | `--use-primitive-flat-union` | `string \| number`                                 |

_@bare-ts_ is also able to flatten union of structs with the CLI option `--use-struct-flat-union`.
Then it adds the `tag` field directly in the struct.
