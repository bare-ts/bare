# 🚀 Contributing

Thank you for investing your time in contributing to this project.

🚧 This guide is a work in progress.

## Posting or commenting an issue

Remember that we are doing this project on our own time.
We are humans: we like support, and we expect kindness :)

When posting a new comment on an issue, make sure your comment adds value.
[Don't post a comment just to get attention][oss-user-behavior].

## Writing code

Any contribution should resolve an [issue][issues].

If there is no [issue][issues] and [discussion][discussions] about the change you want to introduce,
then post a new _issue_ or _discussion_ for discussing that.

This project follows the [lib9 TypeScript style guide][lib9-ts-guide].
We recommend reading the style guide before writing any code.

### Format your changes

Execute `npm run format` to format your code.

### Test your changes

Execute `npm test` to check types and code format, to execute unit tests and lint the code.

### Add a changelog entry

When the changes are visible for the package's users,
you should add an entry in the [changelog](./CHANGELOG.md) in the section entitled `Unreleased`.
A changelog entry should add context and motivation.
Take a look to the previous entries to get examples.

### Commit your changes

This project follows a specific format for commit messages.
It uses a [subset][lib9-commit-guide] of [Conventional commit][conventional-commit].

Every commit should pass the test suite.
You can test several commits at once thanks to `git rebase`.
The following commands test the two last commits:

```sh
git rebase --exec 'npm test' HEAD~2
```

## Project philosophy

### Minimize dependencies

This project embraces a strict policy regarding dependency management.
This aims to avoid potential security vulnerabilities and [software bloat][dep-madness].

1.  Think twice before adding a new dependency.

    If you think a dependency should be added, then justify why.
    This justification should be written in the commit that adds the dependency.

2.  Avoid packages with dozens or hundreds of direct or indirect third-party dependencies.

    Third-party dependencies are packages that aren't authored by the same organization or author.

    [_NPM Graph_](https://npmgraph.js.org) allows visualizing the graph of dependency of a package.

3.  Audit small and untrusted packages

    Sometimes there is no better choice that a package authored by a single developer.
    In this case you should take the time to review the source code.

    Audit every update of the package.
    You should depend on an exact version of the package:

    ```sh
    npm install --save-exact untrusted-package
    ```

    Note that this doesn't apply the restriction on the dependencies of _untrusted-package_.
    This is why you should avoid untrusted packages with untrusted dependencies.

When you add a new dependency,
you should also ensure that its license is compatible with this project.
You should also review the licenses of its direct and indirect dependencies.

[dep-madness]: https://medium.com/s/silicon-satire/i-peeked-into-my-node-modules-directory-and-you-wont-believe-what-happened-next-b89f63d21558
[oss-user-behavior]: https://jacobtomlinson.dev/posts/2022/dont-be-that-open-source-user-dont-be-me/

[conventional-commit]: https://www.conventionalcommits.org/en/v1.0.0/
[discussions]: https://github.com/bare-ts/tools/discussions
[issues]: https://github.com/bare-ts/tools/issues
[lib9-ts-guide]: https://github.com/lib9/guides/blob/main/lib9-typescript-style-guide.md
[lib9-commit-guide]: https://github.com/lib9/guides/blob/main/lib9-versioning-style-guide.md#commit-message-format