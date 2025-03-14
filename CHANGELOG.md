# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning][semver].
The format of this changelog is [a variant][lib9-versionning] of [Keep a Changelog][keep-changelog].
New entries must be placed in a section entitled `Unreleased`.

## Unreleased

-   BREAKING CHANGES: require Node.js 20.19.0 or above

    This allows us to use [import attributes](https://nodejs.org/api/esm.html#import-attributes).
    Their support has been introduced in Node.js 20.10.0.

    Requiring [NodeJs 20.19.0](https://nodejs.org/en/blog/release/v20.19.0/) and above ensures that users may `require` an ESM module.
    This drastically simplifies our `package.json`'s `exports` conditions,
    and prevent [dual-package hazard](https://nodejs.org/api/packages.html#dual-package-hazard).
    As a result, we no longer ship a _CommonJS_ version of the package.

-   BREAKING CHANGES: rename `generate` and `checkSemantic` into `generateJs` and `check`.

    ```diff
    - import { generate, checkSemantic } from "@bare-ts/tools"
    + import { generateJs, check } from "@bare-ts/tools"
    ```

## 0.16.0 (2024-11-02)

-   BREAKING CHANGES: require Node.js 20.0.0 or above

    This allows us to use the built-in Node.js CLI parser and then to remove the [Commander.js](https://www.npmjs.com/package/commander) dependency.
    This reduces the standalone binary size from 77KB to 45KB (42%).

-   Support `require(esm)` in Node.js v22.10 and above

    This package now has the [new exports condition `module-sync`](https://nodejs.org/en/blog/release/v22.10.0#new-module-sync-exports-condition).
    This allows users of Node.js v22.10 and above to import the ESM version of the package using `require`.
    This avoids the issues of [dual-package hazard](https://nodejs.org/api/packages.html#dual-package-hazard).

-   Remove `package.json` `main` and `module` fields

    The `main` and `module` fields supplemented by the `exports` fields.
    `exports` is supported since Node.js v12.7.0
    Since we require Node.js v20.0.0 or above, we can safely remove `main`.

    All major bundlers now support `exports`.
    Hence, we can also remove the `module` field.

## 0.15.0 (2023-10-19)

-   BREAKING CHANGES: require Node.js 16.9.0 or above

-   BREAKING CHANGES: promote regular comments to doc-comments

    Previously, _bare-ts_ introduced a special syntax for doc-comments:

    ```bare
    type Gender enum {
        ## Be inclusive :)
        FLUID
        MALE
        ## One is not born, but becomes a woman
        ##                  -- Simone de Beauvoir
        FEMALE
    }

    ## A Person with:
    ## - a name
    ## - a gender
    type Person {
        ## person's name
        name: str
        ## person's gender
        gender: optional<Gender>
    }
    ```

    This syntax is not part of the _BARE_ specification.
    Thus, the syntax is not portable between _BARE__ implementations.
    To avoid this issue, _bare-ts__ now uses regular comments as doc-comments.
    Every comment that precedes a type definition, an enum value, or a field is a doc-comment.
    The previous schema can now be written as follows:

    ```bare
    type Gender enum {
        # Be inclusive :)
        FLUID
        MALE
        # One is not born, but becomes a woman
        #                  -- Simone de Beauvoir
        FEMALE
    }

    # A Person with:
    # - a name
    # - a gender
    type Person {
        # person's name
        name: str
        # person's gender
        gender: optional<Gender>
    }
    ```

-   BREAKING CHANGES: remove option `--import-config`

    Instead of importing a custom config, you can now pass the config through any encode function.

    For instance, using the example of the README:

    ```js
    const payload = encodeContacts(contacts, {
        initialBufferLength: 256 /* bytes */,
        maxBufferLength: 512 /* bytes */,
    })
    ```

    A default configuration is applied if no one is passed:

    ```js
    const payload = encodeContacts(contacts) // use the default config
    ```

-   BREAKING CHANGES: replace locations with offsets

    Previously, every node and compiler errors carried a `loc` or `location` property.
    A location object contained a `filename`, `line`, `col`, and `offset` properties.

    The `filename` property is now contained in the AST root in the property `filename`.
    `loc` and `location` are replaced by `offset`.

    The line and column numbers must now be computed using the offset.

## 0.14.0 (2023-06-19)

-   BREAKING CHANGES: enum member names in `PascalCase` instead of `CONSTANT_CASE`

    In a bare schema, an `enum` variant must be in `CONSTANT_CASE`:

    ```bare
    type Status enum {
        OPEN = 0
        CLOSE = 1
    }
    ```

    Previously, _bare-ts_ preserved the case:

    ```ts
    export enum Status {
        OPEN = "OPEN",
        CLOSE = "CLOSE",
    }
    ```

    To follow the _TypeScript_ convention, the case is now in `PascalCase`.
    Thus, _bare-ts_ generates the following code:

    ```ts
    export enum Status {
        Open = "Open",
        Close = "Close",
    }
    ```

-   BREAKING CHANGES: remove option `--import-factory`

    Previously, _bare-ts_ allowed external factory functions to build struct objects.
    For now, there is no replacement for this feature.

-   BREAKING CHANGES: remove option `--use-quoted-property`

    Previously, _bare-ts_ allowed emitting JavaScript code with all object properties quoted.
    This feature was under-used and against the JavaScript conventions.

-   Fix name clashes

    Previously, _bare-ts_ did not support the use of aliases like `Map` or `Uint8Array`.
    Now, it properly handles these aliases and uses `globalThis` when necessary.

## 0.13.0 (2023-02-20)

This release **widely improves the usage of unions and flat unions**.

-   BREAKING CHANGES: use strings tags for union of aliases

    Now, _bare-ts_ outputs string tags for unions of aliases.
    You can obtain the previous behavior using the option `--use-int-tag`.

    The following schema ...

    ```bare
    type Person struct { name: str }
    type Organization struct { name: str }
    type Contact union { Person | Organization }
    ```

    ... generates the following types:

    ```ts
    export type Person = { readonly name: string }
    export type Organization = { readonly name: string }
    export type Contact =
        | { tag: "Person"; val: Person }
        | { tag: "Organization"; val: Organization }
    ```

    This makes code more readable and allows assignments between compatible _unions_.

    Using the option `--use-int-tag`, you obtain the previous output:

    ```ts
    export type Person = { readonly name: string }
    export type Organization = { readonly name: string }
    export type Contact =
        | { tag: 0; val: Person }
        | { tag: 1; val: Organization }
    ```

-   BREAKING CHANGES: use type alias as tag's value for flat unions of structs

    _bare-ts_ allows flat unions of aliased structs.
    Previously, it used the type alias in `underscore_case` as tag's value.
    Now, it uses the type alias in its original case.

    For instance, the following union ...

    ```bare
    type BoxedU32 struct { val: u32 }
    type BoxedStr struct { val: str }
    type Boxed union { BoxedU32 | BoxedStr }
    ```

    ... can be flatten (under `--use-flat-union`) to:

    ```diff
    export type BoxedU32 = {
    -   readonly tag: "BOXED_U32", // Previous output
    +   readonly tag: "BoxedU32", // New output
        readonly val: u32,
    }

    export type BoxedStr = {
    -   readonly tag: "BOXED_STR", // Previous output
    +   readonly tag: "BoxedStr", // New output
        readonly val: string,
    }

    export type Boxed = BoxedU32 | BoxedStr
    ```

-   BREAKING CHANGES: split `--use-flat-union` into `--use-primitive-flat-union` and `--use-struct-flat-union`

    Use `--use-primitive-flat-union` and `--use-struct-flat-union` instead of `--use-flat-union`.

-   Flatten unions when possible under `--use-primitive-flat-union` and `--use-struct-flat-union`

    _bare-ts_ is able to flatten unions that consist of:

    1. basic types (bool, u8, str, ...) that have distinct `typeof` values
    2. aliased structs
    3. (anonymous) structs

    Previously, `use-flat-union` required that all unions could be flattened.
    This avoided the introduction of a "best-effort approach".
    However, this was too restrictive.
    A "best-effort approach" seems acceptable since it is opted in.
    Now, _bare-ts_ attempts to flatten a union and falls back to a tagged union.

    Under `--use-struct-flat-union`, the following schema ...

    ```bare
    type A union { bool | f64 | str }
    type B union { f64 | i32 }
    ```

    ... compiles to the following types:

    ```ts
    type A = boolean | number | string
    type B = { tag: 0; val: number } | { tag: 1; val: number }
    ```

    Note that `B` is not flatten because `f64` and `i32` have the same `typeof` value (`number`).

    Under `--use-struct-flat-union`, the following schema ...

    ```bare
    type X struct { ... }
    type Y struct { ... }
    type XY union { X | Y }
    type Z Y
    type XZ union { X | Z }
    type Anonymous union { struct { ... } | struct { ... } }
    ```

    ... compiles to the following types:

    ```ts
    type X = { tag: "X", ... }
    type Y = { tag: "Y", ... }
    type XY = X | Y
    type Z = Y
    type XZ = { tag: "X", val: X } | { tag: "Z", val: "Z" }
    type Anonymous = { tag: 0, ... } | { tag: 1, ... }
    ```

    Note that the union `XZ` is not flatten,
    because one of the elements is not a _struct_ or an _aliased struct_.
    Indeed, `Z` is an _aliased alias_.

-   Support flat unions of _aliased structs_ and _anonymous structs_

    Under the option `--use-struct-flat-union`, the following schema ...

    ```bare
    type Person struct { name: str }
    type Entity union {
        | Person
        # Anonymous entity
        | struct { name: str }
    }
    ```

    ... compiles to the following types

    ```ts
    export type Person = {
        readonly tag: "Person"
        readonly name: string
    }
    export type Entity =
        | Person
        | {
              readonly tag: 1
              readonly name: string
          }
    ```

    We introduce this change for consistency purpose.
    You should avoid mixing _aliased structs_ with _anonymous structs_

## 0.12.0 (2023-02-04)

-   BREAKING CHANGES: emit _TypeSCript_'s type aliases instead of interfaces

    The following schema ...

    ```bare
    type Person struct { name: str }
    ```

    ... compiles to a type alias instead of an interface:

    ```diff
    - export interface Person {
    + export type Person = {
          readonly tag: "Person"
          readonly name: string
      }
    ```

-   BREAKING CHANGES: Emit ES2020

    bare-ts now publishes _ES2020_ builds.
    This outputs smaller builds.
    This should cause no issue since we require a Node.js version `^14.18` or `>=16`.

-   Add option `--lib` to prevent `decode` and `encode` generation

    A _decoder_ and an _encoder_ are generated for every _root type_ that doesn't resolve to `void`.
    The `--lib` flag prevents this generation.

    This is particularly useful for libraries that export only _readers_ and _writers_.

-   Allow _root types_ that resolve to `void`

    Since the `0.9.0` version, _root types_ that resolve to `void` are forbidden.

    To conform with the _BARE_ specification, they are now allowed.
    This makes valid the following schema:

    ```bare
    type Root void
    ```

## 0.11.0 (2022-07-06)

-   BREAKING CHANGES: Remove option `--use-lax-optional`

    This avoids breaking bijective encoding.

## 0.10.0 (2022-06-22)

-   BREAKING CHANGES: Forbid _flat unions_ of transitively _aliased classes_

    Previously, _bare-ts_ allowed _flat unions_ of transitively _aliased classes_.
    It now rejects the following schema under the option `--use-flat-union`:

    ```bare
    type Named struct { name: str }
    type Person Named
    type Message union { Person }
    ```

-   BREAKING CHANGES: Require Node.js `>=14.18.0`

    This enables _bare-ts_ to internally use `node:` prefixes for importing nodes' built-ins.

-   Automatically discriminate _aliased structs_ in _flat unions_

    _bare-ts_ is now able to add a discriminator field for _aliased structs_ in _flat union_.

    The name of the discriminator field is `tag`.
    For now, it is not possible to flatten aliased structs with at least one field named `tag`.

    Thus, under the option `--use-flat-union`, the following BARE schema ...

    ```bare
    type X struct { ... }
    type Y struct { ... }
    type XY union { X | Y }
    ```

    ... compiles to the following types:

    ```ts
    export interface X { readonly tag: "X"; ... }
    export interface Y { readonly tag: "Y"; ... }
    export type XY = X | Y
    ```

-   Allow _flat unions_ of _anonymous structs_

    _bare-ts_ now accepts _flat unions_ of _anonymous structs_.
    It automatically uses the _union tags_ to discriminate the _structs_.

    Under the option `--use-flat-union`, the following _BARE_ schema ...

    ```bare
    type XY union { struct { ... } | struct { ... } }
    ```

    ... compiles to the following types:

    ```ts
    export type XY = { readonly tag: 0, ... } | { readonly tag: 1, ... }
    ```

## 0.9.0 (2022-05-12)

-   BREAKING CHANGES: Rename `bare-ts` CLI to `bare`

-   BREAKING CHANGES: Rename `--legacy-syntax` to `--legacy`

-   BREAKING CHANGES: Remove options `--main` and `--no-main`

    The previous version introduced automatic promotion of _root type_ as _main type_.
    _Root type_ aliases are type aliases that are not referred by a type in the schema.
    _Main type_ aliases are types aliases used to decode and encode messages.

    For the sake of simplicity, main type aliases and root types aliases are now identical.

    In the following schema, `Post` is the only root and main type alias.

    ```bare
    type Person struct { name: str }
    type Post struct { author: Person }
    ```

-   BREAKING CHANGES: Forbid use-before-definition

    In the last _BARE_ draft, use-before-definition are disallowed.
    As a consequence, it also disallows recursive types.
    _bare-ts_ now rejects the following schema:

    ```bare
    type Y X
    type X u8
    ```

    To enable this schema and recursive types, use the option `--legacy`.

-   BREAKING CHANGES: Forbid _root types_ that resolve to `void`

    The following schema is now invalid:

    ```bare
    type Root void
    ```

    This is not part of the BARE specification.

-   BREAKING CHANGES: Do not emit read/write for types resolving to void

-   Annotate your schema with _doc-comments_

    A _BARE_ _doc-comment_ consists in two comment marks `##`.
    Doc-comments can only document:

    -   type definitions
    -   enum values
    -   struct fields

    The following schema documents these three kinds of object:

    ```bare
    type Gender enum {
        ## Be inclusive :)
        FLUID
        MALE
        ## One is not born, but becomes a woman
        ##                  -- Simone de Beauvoir
        FEMALE
    }

    ## A Person with:
    ## - a name
    ## - a gender
    type Person {
        ## person's name
        name: str
        ## person's gender
        gender: optional<Gender>
    }
    ```

    Note that this syntax is not part of the _BARE_ specification.
    Thus, this is not portable between distinct implementations.

-   Add BARE code generator

    This gives a basic way to format a schema.
    Note that comments (except _doc comments_) are stripped out.

    ```sh
    bare-ts compile schema.bare -o schema.bare
    ```

    ```sh
    bare-ts compile schema.bare --generator 'bare'
    ```

## 0.8.0 (2022-04-29)

-   BREAKING CHANGES: Require _@bare-ts/lib_ `v0.3.x`

-   BREAKING CHANGES: Forbid `f32` and `f64` as map key type

    According to _IEEE-754 2019_:
    _NaN_ (Not a Number) is not equal to any value, including itself.

    This inequality leads to different implementations:

    1.  Implementations that "follows" the standard

        An unbounded number of values may be bind to the key _NaN_ and cannot be accessed.
        This is the implementation chosen by _Golang_.

    2.  Implementations that normalize _NaNs_ and consider that _NaN_ is equal to itself

        This is the implementation chosen by _JavaScript_

    3.  Implementations that rely on the binary comparison of _NaNs_

    These make complex the support of `f32` and `f64` as map key type.

    To avoid this complexity, the ongoing _BARE_ draft forbids their usage as map key type.

-   Automatically promote _root type_ as _main type_

    _bare-ts_ generates encoders and decoders for _main types_.
    Main types can be selected with the option `--main`:

    ```sh
    bare-ts compile schema.bare --main Post
    ```

    ```bare
    # schema.bare
    type Person struct { name: str }
    type Post struct { author: Person }
    ```

    If the option `--main` is not set, then _bare-ts_ promotes _root types_ as _main types_.
    _Root types_ are _type aliases_ that are not referred by a type in the schema.

    In the previous schema, `Post` is a _root type_, while `Person` is not.
    The following command has now the same effect as the previous one:

    ```sh
    bare-ts compile schema.bare
    ```

    It promotes `Post` as a _main type_.

    To avoid the promotion of _root types_, you must use the option `--no-main`:

    ```sh
    bare-ts compile schema.bare --no-main
    ```

    `--no-main` and `--main` cannot be both set.

-   Allow leading and trailing pipes in unions

    The following schema is now valid:

    ```bare
    type LeadingPipe union {
        | u8
    }

    type TrailingPipe union {
        u8 |
    }
    ```

-   Do not emit trailing spaces in code generation

## 0.7.0 (2022-04-24)

-   BREAKING CHANGES: require Node.js versions that support _ESM_

    _bare-ts_ requires now a node versions that support _ECMAScript Modules_.

    Note that, _bare-ts_ still exports a _CommonJS_ build.

-   Add pure annotations in generated code

    Pure annotations enable bundler to detect pure function calls.
    _bare-ts_ adds now these annotations in top-level function calls.

-   Allow circular references where possible

    _bare-ts_ was previously conservative about circular references.
    It now allows all circular references that can encode at least one finite message.
    It now accepts the following circular references:

    ```bare
    type A list<A>
    type B map<str><B>
    type C list<optional<C>>[2]
    type D list<union { D | str }>[2]
    type E optional<E>
    type F union { F | str }
    ```

    It still rejects the following circular references:

    ```bare
    type X list<A>[2]
    type Y union { Y }
    type Z struct { field: Z }
    ```

## 0.6.0 (2022-03-31)

-   BREAKING CHANGES: Update _BARE_ syntax

    _bare-ts_ now supports the [new syntax](https://datatracker.ietf.org/doc/draft-devault-bare/03/)
    for BARE schema
    It reports legacy syntax as an error.

    Use the option `--legacy-syntax` for allowing legacy syntax.

## 0.5.0 (2022-03-30)

-   Forbid circular references with fixed lists

    _bare-ts_ now correctly rejects the following schema:

    ```bare
    struct Person {
        bestFriends: [2]Person
    }
    ```

-   Allow _enums_ and _aliased types_ for map key type

    The following schema is now valid:

    ```bare
    enum Gender {
        FLUID
        MALE
        FEMALE
    }
    type GenderNames map[Gender] string
    ```

-   Allow unsorted tags for _unions_ and _enums_

    _bare-ts_ now accepts the following schemas:

    ```bare
    enum Gender {
        FLUID = 1
        MALE = 0
               ^ error was reported here
        FEMALE = 2
    }
    ```

    ```bare
    type UnsignedInt (u8 = 1 | u16 = 0 | u32 = 2 | u64 = 3)
                                     ^ error was reported here
    ```

    Use the option `--pedantic` for rejecting these schemas.

## 0.4.0 (2022-03-26)

-   BREAKING CHANGES: Forbid _main codecs_ resolving to `void`

    The following _BARE_ schema is no longer valid when 'Message' is a _main codec_:

    ```bare
    type Message void
         ^ error is now reported here
    ```

-   BREAKING CHANGES: Forbid _flat unions_ which cannot be automatically flatten

    _bare-ts_ is able to automatically compute the tag of simple flat unions without any help.
    A simple union is either:

    -   a union of base or void types that can be discriminated by their
        _typeof value_, or
    -   a union of classes (requires the option `--use-class`).

    Previously, _bare-ts_ asked the user to provide a tagging function for complex flat unions.
    Now, _bare-ts_ throws an error when it encounters a complex flat union.
    Thus, it no longer supports complex flat unions.

-   Add pedantic mode (option `--pedantic`)

    The pedantic mode requires initializing _enum tags_ and _union tags_.

-   Better code generation

    _bare-ts_ has a normalization step where it alias some types, including anonymous structs, data arrays, and typed arrays.
    _bare-ts_ is now able to generate reader and writer without aliasing these types.

## 0.3.0 (2022-03-02)

-   BREAKING CHANGES: Forbid _BARE_ schema in which a union repeats a type

    Now, _bare-ts_ correctly rejects the following schema:

    ```bare
    type X (u8 | u8)
    ```

-   BREAKING CHANGES: Default to `null` instead of `undefined` for _optional types_

    The use of `null` seems more common than the use of `undefined`.

    The option `--use-null` is removed.
    A new option `--use-undefined` is added.

-   Deduplicate _readers_ and _writers_ of complex _non-aliased types_

    _bare-ts_ generates _readers_ and _writers_ for complex _non-aliased types_.
    These readers and writers are now deduplicated.

-   Make configurable the emitted type for `void`

    _BARE_ allows `void` types in _unions_.
    For example:

    ```bare
    type Union (u8 | void)
    ```

    Previously, _bare-ts_ emitted the type `undefined` for `void`.
    Now, it relies on options `--use-undefined` and `--use-lax-optional` to choose between `null`, `undefined`, and `null | undefined`.
    Note that these options also modify the emitted types for _optionals_.

-   Support for quoted properties

    The option `--use-quoted-property` enables to output quoted properties instead of unquoted properties.

    This can be useful when using a minifier that differently handles quoted properties.

## 0.2.0 (2022-02-20)

-   BREAKING CHANGES: Forbid BARE schema with undefined aliases

-   BREAKING CHANGES: Forbid _BARE_ schema in which length and tags are too large

    Length of fixed data and (typed) array must be an unsigned 32bits integer.
    This is a limitation of the ECMAScript standard.

    Tags of enums and unions must be safe integers.
    In the future, this requirement could be relaxed by switching to bigint for larger integers.

-   BREAKING CHANGES: Forbid BARE schema in which the length of a fixed data is 0

    The following schema is now invalid:

    ```bare
    type EmptyData data<0>
    ```

-   BREAKING CHANGES: Forbid BARE schema in which a union repeats a type

    The following schema is now invalid:

    ```bare
    type X (u8 | u8)
    ```

    Note that the following schema is still valid:

    ```bare
    type Y u8
    type X (u8 | Y)
    ```

    `Y` is a user-defined type.

-   BREAKING CHANGES: Forbid enum members with the same name

    The following schema is now invalid:

    ```bare
    enum Gender {
        FLUID
        FEMALE
        MALE
        FLUID
    }
    ```

-   BREAKING CHANGES: Forbid struct that has several fields with the same name

    The following schema is now invalid:

    ```bare
    struct Person {
        name: string
        name: string
    }
    ```

-   BREAKING CHANGES: Forbid _BARE_ schema with circular references

-   BREAKING CHANGES: adapt to _@bare-ts/lib@0.2.0_

    _@bare-ts/lib@0.2.0_ introduces several breaking changes.
    As a consequence:

    -   all decode/encode are renamed into read/write
    -   all pack/unpack are renamed into encode/decode
    -   decoders (previously unpackers) no longer accept `ArrayBuffer` as type of read buffer

-   Make _bare-ts_ library platform-agnostic

    Use your favorite _ESM_-ready CDN and simply import _bare-ts_.
    This was made possible by removing the dependency over `node:assert`.

-   Add `--use-class` option

    This generates classes instead of interfaces for struct types.

-   Automatically handle simple flat unions

    By default, _bare-ts_ generates tagged unions.
    For instance, the following schema ...

    ```rs
    type Union (A | B)
    ```

    ... compiles to the following types:

    ```ts
    type Union =
        | { readonly tag: 0; readonly val: A }
        | { readonly tag: 1; readonly val: B }
    ```

    You can force the use of _flat unions_ with the option `--use-flat-union`.
    However, you have to provide a function that computes the tag of the object.
    This function must be exported from a file named `ext.{js,ts}` and placed
    in the same directory as the file generated by _bare-ts_.

    ```ts
    export function tagUnion(x: A | B): 0 | 1 {
        // returns 0 if x has type A or 1 if x has type B
    }
    ```

    _bare-ts_ is now able to compute the tag of simple flat unions without
    your help. A simple union is either:

    -   a union of types that can be discriminated by their _typeof value_, or
    -   a union of classes (requires the option `--use-class`).

-   Add _@bare-ts/lib_ as peer dependency

    This informs the users of _bare-ts_ which version of _@bare-ts/lib_ to use.

-   Fix invalid code generation for big tags in _enums_ and _unions_

    _bare-ts_ applies an optimization when tags can be encoded on 7 bits.
    It did not test the general case yet.
    The addition of tests enabled to catch typo errors.
    The generated code imported non-existing readers and writers.

-   Fix generator choice

    The option `--generator` specifies which generator to use for generating
    the output.
    _bare-ts_ uses `ts` as default generator.
    The option `--generator` should override this default.

    Previously, the option did not override the default.

-   Fix location report upon compilation errors

    Upon errors, _bare-ts_ reports the error and a file location.
    It previously reported the location at the end of the first involved token.
    It now reports the location at the start of the first involved token.

    For instance, if a type alias is in lowercase in a BARE schema,
    then the parser reported an error at the end of the alias.
    It now reports the error at the start of the alias:

    ```bare
    type lowerCaseAlias u8
                      ^ error was previously reported here
         ^ error is now reported here
    ```

-   Better diagnostics for reporting unwanted semicolons

## 0.1.1 (2022-01-05)

-   Fix array encoders

    Previously, array encoders did not encode the first item of a generic array.

## 0.1.0 (2022-01-03)

-   _BARE_ schema compiler supports all types

[keep-changelog]: https://keepachangelog.com/en/1.0.0/
[lib9-versionning]: https://github.com/lib9/guides/blob/main/lib9-versioning-style-guide.md#keep-a-changelog
[semver]: https://semver.org/spec/v2.0.0.html
