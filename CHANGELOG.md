# Changelog

This project adheres to [Semantic Versioning][semver].

## Unreleased

-   Automatically discriminate aliased structs in flat unions

    @bare-ts is now able to automatically add a discriminator field for
    aliased structs in flat union.

    The name of the discriminator field is `tag`.
    For now, it is not possible to flatten aliased structs with at least
    one field named `tag`.

    Thus, under the option `--use-flat-union`, the following BARE types:

    ```bare
    type X struct { ... }
    type Y struct { ... }
    type XY union { X | Y }
    ```

    translate to the following TypeScript types:

    ```ts
    export interface X { readonly tag: "X"; ... }
    export interface Y { readonly tag: "Y"; ... }
    export type XY = X | Y
    ```

-   Allow flat unions of anonymous structs

    @bare-ts now accepts flat unions of anonymous structs.
    It automatically uses the union tags to discriminate the structs.

    Under the option `--use-flat-union`, the following BARE types:

    ```bare
    type XY union { struct { ... } | struct { ... } }
    ```

    translate to the following TypeScript types:

    ```ts
    export type XY = { readonly tag: 0, ... } | { readonly tag: 1, ... }
    ```

-   Forbid flat unions of transitively aliased classes

    @bare-ts previously allowed flat unions of transitively aliased classes.
    It now rejects the following schema under the option `--use-flat-union`:

    ```bare
    type Named struct { name: str }
    type Person Named
    type Message union { Person }
    ```

-   Require Node 14.18.0 or above

    @bare-ts now requires Node 14.18.0 or above.
    This enables @bare-ts/tools to internally use `node:` prefixes
    for importing nodes' built-ins.

## 0.9.0 (2022-05-12)

-   Rename `bare-ts` CLI to `bare`

-   Forbid use-before-definition

    In the last BARE draft, use-before-definition are disallowed.
    As a consequence, it also disallows recursive types.
    @bare-ts now rejects the following schema:

    ```bare
    type Y X
    type X u8
    ```

    To enable this schema and recursive types, use the option `--legacy`.

-   Rename `--legacy-syntax` to `--legacy`

-   Annotate your schema with doc-comments

    @bare-ts/tool is now able to recognize a doc-comment and to document
    the generated code with them.

    A BARE doc-comment consists in two comment marks `##`.
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

    Note that this syntax is not part of the BARE specification.
    Thus, this is not portable between distinct implementations.

-   Add BARE code generator

    @bare-ts is now able to output BARE schemas.

    This gives a basic way to format a schema.
    Note that comments (except doc comments) are stripped out.

        @bare-ts compile schema.bare -o schema.bare
        @bare-ts compile schema.bare --generator 'bare'

-   Remove options `--main` and `--no-main`

    The previous version introduced automatic promotion of root type aliases
    as main type aliases. Root type aliases are type aliases that are not
    referred by a type in the schema. Main type aliases are types used
    to decode and encode messages.

    For the sake of simplicity, main type aliases and root types aliases
    are now identical.

    In the following schema, `Post` is the only root/main type alias.

    ```bare
    type Person struct { name: str }
    type Post struct { author: Person }
    ```

-   Forbid root types that resolve to void

    The following schema is now invalid:

    ```bare
    type Root void
    ```

    This is not part of the BARE specification.

-   Do not emit read/write for types resolving to void

## 0.8.0 (2022-04-29)

-   Require @bare-ts/lib v0.3.x

-   Automatically promote root type aliases as main type aliases

    @bare-ts/tool generates encoders and decoders for main type aliases.
    Main type aliases can be selected with the option `--main`:

        @bare-ts compile schema.bare --main Post

    ```bare
    # schema.bare
    type Person struct { name: str }
    type Post struct { author: Person }
    ```

    If the option `--main` is not set, then @bare-ts/tool promotes now
    root type aliases as main type aliases. Root type aliases are type aliases
    that are not referred by a type in the schema.

    In the previous schema, `Post` is a root type alias, while `Person` is not.
    The following command has now the same effect as the previous one:

        @bare-ts compile schema.bare

    It promotes `Post` as a main type aliases.

    To avoid the promotion of root types, you must use the option `--no-main`:

        @bare-ts compile schema.bare --no-main

    `--no-main` and `--main` cannot be both set.

-   BREAKING CHANGES: forbid f32 and f64 as map key type

    According to IEEE-754 2019:
    NaN (Not a Number) is not equal to any value, including itself.

    This inequality leads to different implementations:

    1.  Implementations that "follows" the standard

        In this case, an unbounded number of values may be bind to the key NaN
        and cannot be accessed.

        This is the implementation chosen by Golang.

    2.  Implementations that normalize NaNs and consider that NaN
        is equal to itself

        This is the implementation chosen by JavaScript

    3.  Implementations that rely on the binary comparison of NaNs

    These make complex the support of f32 and f64 as map key type.

    To avoid this complexity the ongoing BARE draft forbids their usage as
    map key type.

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

-   BREAKING CHANGES: require node versions that support ESM

    @bare-ts requires now a node versions that support
    ECMAScript Modules.

    Note that, @bare-ts still exports a CommonJS build.

-   Add pure annotation in generated code

    Pure annotations enable to bundler to detect pure function calls.
    @bare-ts adds now these annotations in top-level function calls.

-   Allow circular references where possible

    @bare-ts was previously conservative about circular references.
    It now allows all circular references that can encode at least one
    finite message.
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

-   Update BARE syntax

    @bare-ts now supports the [new syntax](https://datatracker.ietf.org/doc/draft-devault-bare/03/)
    for BARE schema
    It reports legacy syntax as an error.

    Use the option `--legacy-syntax` for allowing legacy syntax.

## 0.5.0 (2022-03-30)

-   Forbid circular references with fixed lists

    @bare-ts now correctly rejects the following schema:

    ```bare
    struct Person {
        bestFriends: [2]Person
    }
    ```

-   Allow enum type and aliased types for map key type

    The following schema is now valid:

    ```bare
    enum Gender {
        FLUID
        MALE
        FEMALE
    }

    type GenderNames map[Gender] string
    ```

-   Allow unsorted tags for unions and enums

    @bare-ts now accepts the following schemas:

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

    Use the option `--pedantic` for continuing to reject these schemas.

## 0.4.0 (2022-03-26)

-   Forbid main codecs resolving to void type

    The following BARE schema is no longer valid when 'Message' is
    a main codec (using --main CLI option):

    ```bare
    type Message void
         ^ error is now reported here
    ```

-   Forbid flat unions which cannot be automatically flatten

    @bare-ts is able to automatically compute the tag of simple flat unions
    without any help. A simple union is either:

    -   a union of base or void types that can be discriminated by their
        _typeof value_, or
    -   a union of classes (requires the option `--use-class`).

    Previously, @bare-ts asked the user to provide a tagging function for
    other cases (complex flat unions).
    Now, @bare-ts throws an error when it encounters a complex flat union.
    Thus, it no longer supports complex flat unions.

-   Add pedantic mode (option --pedantic)

-   Better code generation

    @bare-ts has a normalization step where it alias some types,
    including anonymous structs, data arrays, and typed arrays.

    @bare-ts is now able to generate reader and writer without
    aliasing these types.

## 0.3.0 (2022-03-02)

-   Fix regression: Forbid BARE schema in which a union repeats a type

    @bare-ts now correctly rejects the following schema:

    ```bare
    type X (u8 | u8)
    ```

-   Deduplicate readers and writers of complex non-aliased types

    @bare-ts generates readers and writers for complex non-aliased types.
    These readers and writers are now deduplicated.

-   Default to null instead of undefined for optional types

    The use of `null` seems more common than the use of `undefined`.

    The option `--use-null` is removed.
    A new option `--use-undefined` is added.

-   Make configurable the emitted type for void type

    BARE schema enable use of void types in unions. For example:

    ```bare
    type Union (u8 | void)
    ```

    Previously, @bare-ts emitted the type `undefined` for `void`.
    Now it relies on options `--use-undefined` and `--use-lax-optional` to
    choose between `null`, `undefined`, and `null | undefined`.
    Note that these options also modify the emitted types for optionals.

-   Support for quoted properties

    The option `--use-quoted-property` enables to output
    quoted properties instead of unquoted properties.

    This can be useful when using a JS minifier that differently handles
    quoted and unquoted properties.

## 0.2.0 (2022-02-20)

-   Fix invalid code generation for big tags in enums and unions

    @bare-ts applies an optimization when tags can be encoded on 7bits.
    It did not test the general case yet.
    The addition of tests enabled to catch typo errors.
    The generated code imported non-existing readers and writers.

-   Fix generator choice

    The option `--generator` specifies which generator to use for generating
    the output.
    @bare-ts uses `ts` as default generator.
    The option `--generator` should override this default.

    Previously the option did not override the default.

-   Fix location report upon compilation errors

    Upon errors, @bare-ts reports the error and a file location.
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

-   Make @bare-ts library platform-agnostic

    Use your favorite ESM-ready CDN and simply import @bare-ts.
    This was made possible by removing the dependency over node:assert.

-   Add `--use-class` option

    This generates classes instead of interfaces for struct types.

-   Automatically handle simple flat unions

    By default, @bare-ts generates tagged unions.
    For instance, the following BARE schema:

    ```rs
    type Union (A | B)
    ```

    generates the TypeScript type:

    ```ts
    type Union =
        | { readonly tag: 0; readonly val: A }
        | { readonly tag: 1; readonly val: B }
    ```

    You can force the use of flat unions with the option `--use-flat-union`.
    However, you have to provide a function that computes the tag of the object.
    This function must be exported from a file named `ext.{js,ts}` and placed
    in the same directory as the file generated by @bare-ts.

    ```ts
    export function tagUnion(x: A | B): 0 | 1 {
        // returns 0 if x has type A or 1 if x has type B
    }
    ```

    @bare-ts is now able to compute the tag of simple flat unions without
    your help. A simple union is either:

    -   a union of types that can be discriminated by their _typeof value_, or
    -   a union of classes (requires the option `--use-class`).

-   Add @bare-ts/lib as peer dependency

    This informs the user of @bare-ts which version of @bare-ts/lib to use.

-   Forbid BARE schema with undefined aliases

-   Forbid BARE schema in which length and tags are too large

    Length of fixed data and (typed) array must be an unsigned 32bits integer.
    This is a limitation of the ECMAScript standard.

    Tags of enums and unions must be safe integers.
    In the future, this requirement could be relaxed by switching to
    bigint for larger integers.

-   Forbid BARE schema in which the length of a fixed data is 0

    The following schema is now invalid:

    ```bare
    type EmptyData data<0>
    ```

-   Forbid BARE schema in which a union repeats a type

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

-   Forbid BARE schema in which an enum have several members with the same name

    The following schema is now invalid:

    ```bare
    enum Gender {
        FLUID
        FEMALE
        MALE
        FLUID
    }
    ```

-   Forbid BARE schema in which a struct has several fields with the same name

    The following schema is now invalid:

    ```bare
    struct Person {
        name: string
        name: string
    }
    ```

-   Forbid BARE schema with circular references

-   Better diagnostics for reporting unwanted semicolons

-   BREAKING CHANGE: adapt to @bare-ts/lib@0.2.0

    @bare-ts/lib@0.2.0 introduces several breaking changes.
    As a consequence:

    -   all decode/encode are renamed into read/write
    -   all pack/unpack are renamed into encode/decode
    -   decoders (previously unpackers) no longer accept `ArrayBuffer` as
        type of read buffer

## 0.1.1 (2022-01-05)

-   Fix array encoders

    Previously array encoders did not encode the first item of a generic array.

## 0.1.0 (2022-01-03)

-   BARE schema compiler supports all types

[semver]: https://semver.org/spec/v2.0.0.html
