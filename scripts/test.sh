#!/bin/sh
set -eu

npm run build

# unit tests
npx oletus dist/*/*.test.js tests-corpus/*.test.js tests-corpus/*/*/*.test.js

# lint
npx rome ci src scripts
npx rome check tests-corpus

# type check
npx tsc --build src/tsconfig-*.json tests-corpus
