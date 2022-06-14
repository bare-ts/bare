#!/bin/sh
set -eu

npm run build

# unit tests
npx oletus dist/*/*.test.js tests-corpus/*.test.js tests-corpus/*/*/*.test.js

# type check
npx tsc --build src/tsconfig-*.json tests-corpus

# lint
npx denolint src
npx denolint scripts
npx denolint tests-corpus

# style check
npx prettier --loglevel=warn --check src *.md *.json
