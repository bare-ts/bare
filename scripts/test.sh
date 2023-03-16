#!/bin/sh

. scripts/build.sh

# unit tests
oletus dist/*/*.test.js tests-corpus/*.test.js tests-corpus/*/*/*.test.js

# lint
rome ci .

# type check
tsc --build src/tsconfig-test.json tests-corpus/
