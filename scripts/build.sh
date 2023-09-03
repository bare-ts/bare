#!/bin/sh
set -eu

# https://node.green/#ES2022
# https://kangax.github.io/compat-table/es2016plus
TARGET='node16.9.0'
VERSION=\""$npm_package_version"\"

# build .d.ts
tsc --build src/

cp -f dist/index.d.ts dist/index.d.cts

# build ESM
esbuild 'src/**/*.ts' --target=$TARGET --define:VERSION=$VERSION --outdir=dist --log-level=warning

# build CommonJS (fallback)
esbuild src/index.ts --bundle --target=$TARGET --platform=node > dist/index.cjs

# build standalone cli program
esbuild dist/bin/cli.js --bundle --target=$TARGET --minify --keep-names --platform=node > dist/bin/bare
