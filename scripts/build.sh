#!/bin/sh
set -eu

# https://node.green/#ES2022
# https://kangax.github.io/compat-table/es2016plus
TARGET='node20.10.0'

# build ESM and .d.ts
npx tsc --build src/tsconfig.bin.json

cp -f dist/index.d.ts dist/index.d.cts

# build CommonJS (fallback)
esbuild src/index.ts --bundle --target=$TARGET --platform=node > dist/index.cjs

# build standalone cli program
esbuild dist/bin/bare.js --bundle --target=$TARGET --minify --keep-names --platform=node > dist/bin/bare
