#!/bin/sh
set -eu

# check presence of 'Unreleased' string
grep --quiet '^## Unreleased$' CHANGELOG.md

DATE="$(date -u +%Y-%m-%d)"

# set version and current date
sed -i "s/^## Unreleased$/## $npm_package_version ($DATE)/" CHANGELOG.md

echo "\"$npm_package_version\"" > VERSION.json

git add CHANGELOG.md VERSION.json
