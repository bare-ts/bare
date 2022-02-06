#!/bin/sh

set -e

# build .d.ts
npx tsc --build src

# build CommonJS
npx esbuild src/index.ts \
    --bundle \
    --platform='node' --main-fields='module' \
    --format='cjs' \
    --target='es2019' \
    --outdir='dist' \
    --out-extension:.js=.cjs \
    --log-level='warning'

# build ESM
npx esbuild src/**/*.ts src/*.ts \
    --bundle \
    --external:'*.js' --external:'commander' \
    --platform='node' --main-fields='module' \
    --format='esm' \
    --target='es2019' \
    --outdir='dist' \
    --sourcemap \
    --log-level='warning'
