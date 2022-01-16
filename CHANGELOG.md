# Changelog

This project adheres to [Semantic Versioning][semver].

## Unreleased

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
