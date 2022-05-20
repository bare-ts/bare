#!/bin/sh
set -eu

sh scripts/build.sh "$@"

# type check
npx tsc --build tests tests-corpus

# unit tests
npx oletus tests/*.test.js tests-corpus/*/*/*.test.js

# lint
npx denolint src
npx denolint tests
npx denolint scripts
npx denolint tests-corpus

# style check
npx prettier --loglevel 'warn' --check src/ tests/ *.md *.json
