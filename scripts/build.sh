#!/bin/sh
set -eu

# build .d.ts
npx tsc --build src

cp dist/index.d.ts dist/index.d.cts

# build ESM
npx esbuild src/index.ts src/*/*.ts --outdir=dist --log-level=warning

# build CommonJS (fallback)
npx esbuild src/index.ts --bundle --platform=node > dist/index.cjs

# build cli (bin)
npx esbuild src/cli.ts --define:VERSION=\""$npm_package_version"\" > dist/cli.js

# build standalone cli program
npx esbuild dist/cli.js --bundle --minify --keep-names --platform=node > dist/bare
