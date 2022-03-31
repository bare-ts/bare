# bare-ts

[![CI status][ci-img]][ci-url]
[![Coverage percentage][coveralls-img]][coveralls-url]
[![dependency count][bundlephobia-dep-img]][bundlephobia-url]
[![minified and zipped size][bundlephobia-minzip-img]][bundlephobia-url]
[![NPM version][npm-version-img]][npm-url]

[BARE][bare] (Binary Application Record Encoding) is a schema-based binary format that favors compactness and simplicity.
[bare-ts/tools](#) provides a compiler to generate Typescript or Javascript code from a BARE schema.

Warning: BARE specification is currently a IEF draft.
The specification is likely to evolve before its final release. [bare-ts](#) implements an ongoing draft that is not published yet.


## Getting started

bare-ts provides two npm packages:
- @bare-ts/tools enables to generate decoders and encoders from a schema
- @bare-ts/lib provides basic decoders and encoders

Install @bare-ts/tools as a dev dependency and @bare-ts/lib as a dependency:

```sh
npm install --save-dev @bare-ts/tools
npm install @bare-ts/lib
```

Let's us take a simple use-case.
Your application enables to synchronize a list of contacts.
First, you have to write a bare schema:

```zig
type Gender enum {
    FEMALE
    FLUID
    MALE
}

type Person struct {
    name: str
    email: str
    gender: optional<Gender>
}

type Organization struct {
    name: str
    email: str
}

type Contact union { Person | Organization }

type Contacts list<Contact>
```

Next, you have to compile your schema into code:

```sh
bare-ts compile schema.bare -o code.ts --main Contacts
```

The option `--main` specifies which type is used to encode and decode messages.

Once the code generated, you can encode and decode messages:

```ts
import { decodeContacts, encodeContacts, Gender } from "./code.js"
import { strict } from "assert"

const contacts = [
    { tag: /* Person */ 0, val: {
        name: "Seldon",
        email: "seldon@foundation.org",
        gender: Gender.MALE
    } },
]

const payload = encodeContacts(contacts)
const contacts2 = decodeContacts(payload)

strict.deepEqual(contacts, contacts2)
```


## Why BARE?

**Compact messages**: In contrast to BSON, CBOR, and MessagePack, BARE messages do not embed schema information.

**Bijective encoding when possible**: most of BARE values have a single binary representation. This makes easier the support of use-cases such as message deduplication.

**Focus on modern platforms**: Messages are octet-aligned and use little-endian representation.

**Simple**: In contrast to Protocol Buffer and Flat Buffer, BARE does not constraint its binary format in order to support schema evolution.
In Protocol Buffer, this leads to embed some kind of schema inside messages and to make optional every field.
Bare propose a simple way to support backward compatibility: the root type of a message should be the union of all versions of the schema.


## Why bare-ts?

**Pragmatic error reporting**: [bare-ts](#) distinguishes errors that can be recovered and errors that signal the misuse of the API (violation of preconditions).
Only the decoders may emit recoverable errors (`BareError`) and provide enough information to understand why the message is malformed.
The violation of a precondition emits an `AssertionError`.
[bare-ts](#) assumes the use of TypeScript.
This assumption reduces the number of preconditions to check.

**Optimized bundle size**: [bare-ts](#) adopts a functional programming style.
This enables to take advantage of modern dead code elimination techniques, especially _tree shaking_.
Using bundlers such as rollup or webpack, your bundle can contain only the functions which are actually used.
Moreover, [bare-ts](#) uses the node's `assert` module to express preconditions.
You can use [dedicated tools][unassert] to remove them.

**Generation of efficient code** [bare-ts](#) takes care to generate code that may be optimized by modern JavaScript engines.

[bare]: https://baremessages.org
[bare-ts-lib]: https://github.com/bare-ts/lib
[unassert]: https://github.com/unassert-js
[ci-img]: https://flat.badgen.net/github/checks/bare-ts/tools/?label=CI
[ci-url]: https://github.com/bare-ts/tools/actions/workflows/ci.yml
[npm-version-img]: https://flat.badgen.net/npm/v/@bare-ts/tools
[npm-url]: https://www.npmjs.com/package/@bare-ts/tools
[coveralls-img]: https://flat.badgen.net/coveralls/c/github/bare-ts/tools
[coveralls-url]: https://coveralls.io/github/bare-ts/tools?branch=main
[bundlephobia-minzip-img]: https://flat.badgen.net/bundlephobia/minzip/@bare-ts/tools?label=minzipped
[bundlephobia-dep-img]: https://flat.badgen.net/bundlephobia/dependency-count/@bare-ts/tools?label=dependency
[bundlephobia-url]: https://bundlephobia.com/package/@bare-ts/tools