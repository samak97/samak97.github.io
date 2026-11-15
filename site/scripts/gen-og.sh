#!/bin/sh
# Renders scripts/og.html into public/og.png (the link-preview image) with headless Google Chrome.
# Run from site/: sh scripts/gen-og.sh   (macOS path to Chrome; set CHROME to override)
set -e
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
cd "$(dirname "$0")"
"$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --allow-file-access-from-files \
  --virtual-time-budget=5000 --window-size=1200,630 --screenshot="$PWD/../public/og.png" "file://$PWD/og.html"
echo "Wrote public/og.png"
