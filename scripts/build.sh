#!/bin/sh
set -eu

# build .d.ts
tsc --build src

cp -f dist/index.d.ts dist/index.d.cts

# build ESM
esbuild src/index.ts src/*/*.ts --outdir=dist --log-level=warning

# build CommonJS (fallback)
esbuild src/index.ts --bundle --platform=node > dist/index.cjs

# build cli (bin)
esbuild src/cli.ts --define:VERSION=\""$npm_package_version"\" > dist/cli.js

# build standalone cli program
esbuild dist/cli.js --bundle --minify --keep-names --platform=node > dist/bare
