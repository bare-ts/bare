#!/bin/sh

. scripts/build.sh

# unit tests
oletus dist/*/*.test.js tests-corpus/*.test.js tests-corpus/*/*/*.test.js

# lint
rome ci src scripts
rome check tests-corpus

# type check
tsc --build src/tsconfig-*.json tests-corpus
