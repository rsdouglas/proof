#!/usr/bin/env bash
# Export pro waitlist entries from WIDGET_KV
# Run: bash scripts/export-pro-waitlist.sh [--env production]
#
# Requires: wrangler CLI authenticated, CLOUDFLARE_API_TOKEN set
# Output: CSV to stdout — pipe to a file: ... > waitlist.csv

set -euo pipefail

KV_NAMESPACE_ID="731e18288e9e4de091e01e0a5d6d3cc4"
ENV_FLAG="${1:-}"  # pass --env production if needed

echo "email,joined_at"

# List all keys with pro-waitlist: prefix
keys=$(wrangler kv key list \
  --namespace-id "$KV_NAMESPACE_ID" \
  --prefix "pro-waitlist:" \
  $ENV_FLAG \
  2>/dev/null | jq -r '.[].name')

if [ -z "$keys" ]; then
  echo "(no entries)" >&2
  exit 0
fi

for key in $keys; do
  value=$(wrangler kv key get \
    --namespace-id "$KV_NAMESPACE_ID" \
    "$key" \
    $ENV_FLAG \
    2>/dev/null)
  email=$(echo "$value" | jq -r '.email // empty')
  joined=$(echo "$value" | jq -r '.joined_at // empty')
  echo "$email,$joined"
done
