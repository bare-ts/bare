# Changelog

This project adheres to [Semantic Versioning][semver].

## Unreleased

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

## 0.1.1 (2020-01-05)

* Fix array encoders

    Previously array encoders did not encode the first item of a generic array.

## 0.1.0 (2020-01-03)

* BARE schema compiler supports all types


[semver]: https://semver.org/spec/v2.0.0.html
