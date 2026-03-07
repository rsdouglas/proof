#!/usr/bin/env bash
# Sync Astro dist → apps/landing to prevent P0 routing bugs
# Run: cd apps/marketing-site && npm run build && cd ../.. && bash tools/sync-landing.sh
set -e
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$REPO/apps/marketing-site/dist"
LANDING="$REPO/apps/landing"
[ -d "$DIST" ] || { echo "Run astro build first"; exit 1; }
mkdir -p "$LANDING/for" "$LANDING/vs" "$LANDING/_astro"
for d in for vs; do
  # Hub index page (dist/for/index.html → apps/landing/for/index.html)
  [ -f "$DIST/$d/index.html" ] && cp "$DIST/$d/index.html" "$LANDING/$d/index.html" && echo "synced $d/index"
  # Sub-pages (dist/for/accountants/index.html → apps/landing/for/accountants.html)
  find "$DIST/$d" -mindepth 2 -name 'index.html' 2>/dev/null | while read f; do
    name=$(basename "$(dirname "$f")")
    cp "$f" "$LANDING/$d/$name.html"
    echo "synced $d/$name"
  done
done
# Remove stale for.html / vs.html if they exist
rm -f "$LANDING/for/for.html" "$LANDING/vs/vs.html"
mkdir -p "$LANDING/blog"
[ -f "$DIST/blog/index.html" ] && cp "$DIST/blog/index.html" "$LANDING/blog/index.html"
find "$DIST/blog" -mindepth 2 -name 'index.html' 2>/dev/null | while read f; do
  slug=$(basename "$(dirname "$f")")
  mkdir -p "$LANDING/blog/$slug"
  cp "$f" "$LANDING/blog/$slug/index.html"
done
[ -d "$DIST/_astro" ] && cp -r "$DIST/_astro/." "$LANDING/_astro/"
echo "✅ Sync done. Commit apps/landing/."
