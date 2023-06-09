#!/bin/sh
set -eu

# unit tests
bun test src/ tests-corpus/

# lint
rome ci src/ scripts/
rome check tests-corpus/

# type check
tsc --noEmit
