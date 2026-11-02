#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to minify assets." >&2
  exit 1
fi

minify_js() {
  local src="$1"
  local out="$2"
  npx --yes terser "$src" -c -m -o "$out"
}

minify_css() {
  local src="$1"
  local out="$2"
  npx --yes cleancss -o "$out" "$src"
}

minify_js "site.js" "site.min.js"
minify_js "chatbot.js" "chatbot.min.js"
minify_js "desktop-hover.js" "desktop-hover.min.js"
minify_js "redirect.js" "redirect.min.js"
minify_js "settings.js" "settings.min.js"
minify_js "tapfx.js" "tapfx.min.js"
minify_js "maintenance.js" "maintenance.min.js"
minify_js "notfound.js" "notfound.min.js"
minify_js "transformer.js" "transformer.min.js"
minify_js "wasm.js" "wasm.min.js"

minify_css "style.css" "style.min.css"
minify_css "desktop-hover.css" "desktop-hover.min.css"

echo "Minified JS and CSS assets written to the repository root."
