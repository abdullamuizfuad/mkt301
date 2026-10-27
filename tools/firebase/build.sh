#!/bin/sh
# Rebuild vendor/firebase.js (the Firebase SDK, bundled so the site needs no CDN).
# Run from the repo root. Pinned versions: change FIREBASE to upgrade.
set -e
FIREBASE=11.10.0
D=$(mktemp -d)
cp tools/firebase/entry.js "$D/"
(cd "$D" && npm init -y >/dev/null && npm i -s firebase@$FIREBASE esbuild@0.24.0 &&
  npx esbuild entry.js --bundle --minify --format=iife --global-name=FBSDK --target=es2019 --legal-comments=none --outfile=firebase.js)
mkdir -p vendor
{ echo "/* Firebase JS SDK $FIREBASE (app, auth, firestore), bundled by tools/firebase/build.sh. Apache-2.0, (c) Google LLC. */"; cat "$D/firebase.js"; } > vendor/firebase.js
rm -rf "$D"
ls -l vendor/firebase.js
