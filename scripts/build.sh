#!/bin/sh
set -eu

# https://node.green/#ES2020
# https://kangax.github.io/compat-table/es2016plus
TARGET=es2020

# build .d.ts
tsc --build src/

cp -f dist/index.d.ts dist/index.d.cts

# build ESM
esbuild src/index.ts src/*/*.ts --target=$TARGET --outdir=dist --log-level=warning

# build CommonJS (fallback)
esbuild src/index.ts --bundle --target=$TARGET --platform=node > dist/index.cjs
esbuild src/index.ts --bundle --target=$TARGET --keep-names --format=esm --platform=node > dist/index.mjs

# build cli (bin)
esbuild src/cli.ts --target=$TARGET --define:VERSION=\""$npm_package_version"\" > dist/cli.js

# build standalone cli program
esbuild dist/cli.js --bundle --target=$TARGET --minify --keep-names --platform=node > dist/bare
