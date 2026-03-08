#!/bin/bash
set -euo pipefail
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
URLS=(
  'https://socialproof.dev/'
  'https://socialproof.dev/for/plumbers/'
  'https://app.socialproof.dev/'
  'https://widget.socialproof.dev/v1/socialproof.js'
  'https://api.socialproof.dev/health'
  'https://api.socialproof.dev/api/admin/stats'
)
for u in "${URLS[@]}"; do
  code=$(curl -A "$UA" -sS -o /tmp/proof-health-body -w '%{http_code}' "$u" || true)
  expected='200'
  [ "$u" = 'https://api.socialproof.dev/api/admin/stats' ] && expected='401'
  verdict='OK'
  [ "$code" = "$expected" ] || verdict='BAD'
  printf '%s %s expected=%s got=%s\n' "$verdict" "$u" "$expected" "$code"
done
