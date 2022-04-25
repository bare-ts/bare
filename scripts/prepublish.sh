#!/bin/sh
set -eu

# ensure clean index
test -z "$(git status --porcelain)"

# clean-up
rm -rf dist

# build/test
sh scripts/test.sh "$@"
