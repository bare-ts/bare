# 🚀 Contributing

Thank you for investing your time in contributing to this project.

🚧 This guide is a work in progress.

## Posting or commenting an issue

Remember that we are doing this project on our own time.
We are humans: we like support, and we expect kindness :)

When posting a new comment on an issue, make sure your comment adds value.
[Don't post a comment just to get attention][oss-user-behavior].

## Writing code

Any contribution should resolve an _issue_.
If there is no _issue_ about the change you want to introduce,
then post a new _issue_ for discussing that.

Before writing code

### Document your changes

The code should explain by itself the programmers'intentions.
Choose consistent names and ensure a clear control flow.

The code should be accompanied by comments that justify design choices
and bring some context.

Every commit message follows the following format:

    <type>(<optional-scope>): <subject>

    <optional-body>

**Allowed types**:

-   `feat`, new feature
-   `fix`, bugfix
-   `docs`, documentation update
-   `test`, test update
-   `chore`, project housekeeping (dependency, build updates)
-   `perf`, performance improvement
-   `refactor`, code refactoring without change in functionality

When working on a change, you may temporarily use `WIP` as type.

**Scope**:

-   specify the place of the change
-   rarely used.

**Subject**:

-   use imperative, present tense: "add" not "added" nor "adds"
-   don't capitalize first letter
-   no dot at the end

**Body**:

-   explain the introduced changes, design choices
-   if the introduced change is a breaking change, then the body
    should include the string `BREAKING CHANGES`.
    It should propose a way for updating codes that will break.

When the changes are visible for the package's users, you should also
add an entry in the [Changelog](./CHANGELOG.md).

Every commit should pass the test suite.
You can test several commits at once thanks to `git rebase`.
The following commands test the two last commits:

    git rebase --exec 'npm test' HEAD~2

## Project philosophy

### Minimize dependencies

This project embraces a strict policy regarding dependency management.
This aims to avoid potential security vulnerabilities and [software bloat][dep-madness].

1.  Think twice before adding a new dependency.

    If you think a dependency should be added, then justify why.
    This justification should be written in the commit that adds the dependency.

2.  Avoid packages with dozens or hundreds of
    direct or indirect third-party dependencies.

    Third-party dependencies are packages that aren't authored by
    the same organization or the same author.

    You can use [_NPM Graph_](https://npmgraph.js.org) to visualize the
    graph of dependency of a package.

3.  Audit small and untrusted packages

    Sometimes there is no better choice that a package authored by
    a single developer.
    In this case you should take the time to review the source code.

    To have to audit every update of the package.
    To ensure that, you should depend on an exact version of the package:

        npm install --save-exact untrusted-package

    Note that this doesn't apply the restriction on the dependencies of
    _untrusted-package_. This is why you should avoid untrusted packages
    with untrusted dependencies.

When you add a new dependency, you should also ensure that its license
is compatible with this project.
You should also review the licenses of its direct and indirect dependencies.

[dep-madness]: https://medium.com/s/silicon-satire/i-peeked-into-my-node-modules-directory-and-you-wont-believe-what-happened-next-b89f63d21558
[oss-user-behavior]: https://jacobtomlinson.dev/posts/2022/dont-be-that-open-source-user-dont-be-me/
