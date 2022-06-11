# Guidelines for contributing

Thank you for investing your time in contributing to this project.

Warning: this guide is a work in progress.

## Write an issue

Remember that we are doing this project on our own time.
We are humans: we like support, and we expect kindness :)

When posting a new comment on an issue, make sure your comment adds value.
[Don't post a comment just to get attention][oss-user-behavior].

## Write code

### Git and change documentation

This project uses a single _Git_ branch named _main_.
All commits form a chain without any branching.

Every commit message follows the [Angular commit convention][angular-commit].
This project uses [validate-commit-message][validate-commit-message]
to validate the commit message.
The _Git_ hook is automatically setup when you install the package.

You should use descriptive commit messages that explain the introduced changes.
When the changes are visible for the package's users, you should also
add an entry in the [Changelog](./CHANGELOG.md).

Every commit should pass the test suite.
You can test several commits at once thanks to `git rebase`.
The following commands test the two last commits:

    git rebase --exec 'npm test' HEAD~2

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

[angular-commit]: https://docs.google.com/document/d/1rk04jEuGfk9kYzfqCuOlPTSJw3hEDZJTBN5E5f1SALo
[dep-madness]: https://medium.com/s/silicon-satire/i-peeked-into-my-node-modules-directory-and-you-wont-believe-what-happened-next-b89f63d21558
[oss-user-behavior]: https://jacobtomlinson.dev/posts/2022/dont-be-that-open-source-user-dont-be-me/
[validate-commit-message]: https://github.com/Frikki/validate-commit-message/
