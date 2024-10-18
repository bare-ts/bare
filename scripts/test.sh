#!/bin/sh

. scripts/build.sh

# unit tests
node --test

# lint
biome ci --error-on-warnings .

# type check
tsc --build src/ src/tsconfig-test.json tests-corpus/
