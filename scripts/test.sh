#!/bin/sh

. scripts/build.sh

# unit tests
oletus dist/*/*.test.js tests-corpus/*.test.js tests-corpus/*/*/*.test.js

# lint
biome ci --error-on-warnings .

# type check
tsc --build src/ src/tsconfig-test.json tests-corpus/
