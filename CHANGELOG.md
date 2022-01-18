# Changelog

This project adheres to [Semantic Versioning][semver].

## Unreleased

* Fix generator choice

    The option `--generator` enables to specify which generator is used to
    produce the output.
    When the output is written to stdout, the generator `ts` is used by
    default.
    The option `--generator` should override this default.

    Previously the option did not override the default.

* Fix location report upon compilation errors

    Upon errors the compiler reports the error and a file location.
    Previously, the reported location was shifted by 1 column and at
    the end of a token.
    Now, the compiler reports the correct location and at the start of a
    token.

    For instance, if a type alias is in lowercase in a bare schema,
    then the parser reported an error at the end of the alias.
    The error is now reported at the start of the alias:

    ```bare
    type lowerCaseAlias u8
                      ^ error was previously reported here
         ^ error is now reported here
    ```

* Add `--use-class` option

    This generates classes instead of interfaces for struct types.

* Add @bare-ts/lib as peer dependency

    This enables to inform the user of @bare-ts/tools which version of
    @bare-ts/lib is expected.

* Forbid bare schema in which an enum have several members with the same name

    The following schema is now invalid:

    ```bare
    enum Gender {
        FLUID
        FEMALE
        MALE
        FLUID
    }
    ```

* Forbid bare schema in which a struct have several fields with the same name

    The following schema is now invalid:

    ```bare
    struct Person {
        name: string
        name: string
    }
    ```

* Better diagnostics when semicolons are used to separate enum or
    struct members

* BREAKING CHANGE: adapt to @bare-ts/lib@0.2.0

    @bare-ts/lib@0.2.0 introduces several breaking change.
    As a consequence:
    - all decode/encode are renamed into read/write
    - all pack/unpack are renamed into encode/decode
    - decoders (previously unpackers) no longer accept `ArrayBuffer` as 
    type of read buffer

## 0.1.1 (2020-01-05)

* Fix array encoders

    Previously array encoders did not encode the first item of a generic array.

## 0.1.0 (2020-01-03)

* BARE schema compiler supports all types


[semver]: https://semver.org/spec/v2.0.0.html
