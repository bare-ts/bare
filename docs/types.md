
## Primitive types

| BARE type  | JS type     | Binary representation                    |
|------------|-------------|------------------------------------------|
| bool       | boolean     | 0: false, 1: true                        |
| f32        | number      | single-precision float                   |
| f64        | number      | double-precision float                   |
| i8         | number      | 8 bits signed integer                    |
| i16        | number      | 16 bits signed integer                   |
| i32        | number      | 32 bits signed integer                   |
| i64        | bigint      | 64 bits signed integer                   |
| int        | bigint      | variable-length signed integer           |
| u8         | number      | 8 bits unsigned integer                  |
| u16        | number      | 16 bits unsigned integer                 |
| u32        | number      | 32 bits unsigned integer                 |
| u64        | bigint      | 64 bits unsigned integer                 |
| uint       | bigint      | variable-length unsigned integer         |
| str        | string      | length-prefixed UTF-8 string             |
| data       | ArrayBuffer | length-prefixed blob of data             |
| data\[len] | ArrayBuffer | fixed-length blob of data                |

All primitive types ensure a bijective encoding, but str, f32, and f64.
If you wish to support use-cases such as message deduplication,
then you should take care to normalize your strings and floats (NaNs).

## Arrays

| BARE type     | JS type      | Binary representation                       |
|---------------|--------------|---------------------------------------------|
| list\<T>      | readonly T[] | length-prefixed sequence of value of type T |
| list\<T>[len] | readonly T[] | fixed-length sequence of value of type T    |

If the option `--use-generic-array` is not set,
then BARE uses corresponding typed arrays:

| BARE type          | JS type        |
|--------------------|----------------|
| list\<i8>          | Int8Array      |
| list\<i16>         | Int16Array     |
| list\<i32>         | Int32Array     |
| list\<i64>         | BigInt64Array  |
| list\<u8>          | Uint8Array     |
| list\<u16>         | Uint16Array    |
| list\<u32>         | Uint32Array    |
| list\<u64>         | BigUint64Array |

## Optional

| BARE type    | JS type                | Binary representation       |
|--------------|------------------------|-----------------------------|
| optional\<T> | T \| null              | Value tagged with a boolean |


If the option `--use-undefined` is set,
then @bare-ts uses undefined instead of null.
