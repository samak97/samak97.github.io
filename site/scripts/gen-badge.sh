#!/bin/sh
# Renders scripts/badge.html into the footer lanyard's textures: public/badge-front.jpg, badge-back.jpg and
# badge-strap.jpg, with headless Google Chrome, then compresses them with sips.
# Run from site/: sh scripts/gen-badge.sh   (macOS; set CHROME to override the Chrome path)
set -e
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
cd "$(dirname "$0")"
render() { # part width height
  "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 --allow-file-access-from-files \
    --virtual-time-budget=5000 --window-size="$2,$3" --screenshot="$PWD/badge-$1.png" "file://$PWD/badge.html#$1"
  sips -s format jpeg -s formatOptions 86 "badge-$1.png" --out "../public/badge-$1.jpg" >/dev/null
  rm "badge-$1.png"
}
render front 1024 1440
render back 1024 1440
render strap 1600 192
echo "Wrote public/badge-front.jpg, badge-back.jpg, badge-strap.jpg"
