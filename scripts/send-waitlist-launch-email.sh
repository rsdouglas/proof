#!/usr/bin/env bash
# Send launch email to all waitlist signups in WIDGET_KV
# 
# Usage:
#   bash scripts/send-waitlist-launch-email.sh
#   bash scripts/send-waitlist-launch-email.sh --dry-run   # preview only, no sends
#
# Requires:
#   - RESEND_API_KEY env var set  (or exported before running)
#   - wrangler CLI authenticated
#
# Safety:
#   - Sets a KV key "waitlist:__launch_sent" after sending to prevent double-sends
#   - Check with: wrangler kv key get --namespace-id $KV_NAMESPACE_ID "waitlist:__launch_sent"

set -euo pipefail

KV_NAMESPACE_ID="731e18288e9e4de091e01e0a5d6d3cc4"
DRY_RUN=false
SENT_MARKER_KEY="waitlist:__launch_sent"

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "👉 DRY RUN — no emails will be sent"
fi

# Check double-send protection
already_sent=$(wrangler kv key get \
  --namespace-id "$KV_NAMESPACE_ID" \
  "$SENT_MARKER_KEY" 2>/dev/null || echo "")

if [[ -n "$already_sent" ]]; then
  echo "‌ Launch email already sent at: $already_sent"
  echo "   To resend anyway, delete the marker key first:"
  echo "   wrangler kv key delete --namespace-id $KV_NAMESPACE_ID \"waitlist:__launch_sent\""
  exit 1
fi

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "‌ RESEND_API_KEY is not set. Export it first:"
  echo "   export RESEND_API_KEY=re_..."
  exit 1
fi

# List all waitlist keys
echo "📋 Listing waitlist entries..."
keys=$(wrangler kv key list \
  --namespace-id "$KV_NAMESPACE_ID" \
  --prefix "waitlist:" \
  2>/dev/null | jq -r '.[].name | select(test("^waitlist:[^_]"))')

if [[ -z "$keys" ]]; then
  echo "⚣️  No waitlist entries found (KV is empty). Nothing to send."
  exit 0
fi

count=$(echo "$keys" | wc -l | tr -d ' ')
echo "🛌 Found $count waitlist signups"

if $DRY_RUN; then
  echo ""
  echo "Would send to:"
  for key in $keys; do
    email="${key#waitlist:}"
    echo "  • $email"
  done
  exit 0
fi 

# Confirm before sending
echo ""
read -p "Send launch email to $count people? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi 

sent=0
failed=0

for key in $keys; do
  email="${key#waitlist:}"
  
  response=$(curl -s -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\
      \"from\": \"Vouch <hello@socialproof.dev>\",\
      \"to\": [\"$email\"],\
      \"subject\": \"Vouch is live — and it's free\",\
      \"text\": \"Hey —\n\nA while back you signed up to hear about Vouch. It's live now.\n\nVouch makes it easy to collect testimonials from happy customers — one link, they fill a form, you approve it, it embeds on your site in minutes.\n\nIt's free to start. No credit card.\n\n→ Start free at https://socialproof.dev\n\n– The Vouch team\",\
      \"html\": \"<p>Hey &mdash;</p><p>A while back you signed up to hear about Vouch. It&apos;s live now.</p><p>Vouch makes it easy to collect testimonials from happy customers &mdash; one link, they fill a form, you approve it, it embeds on your site in minutes.</p><p>It&apos;s free to start. No credit card.</p><p><a href='https://socialproof.dev'>→ Start free at socialproof.dev</a></p><p>&mdash; The Vouch team</p>\"
    }")
  
  if echo "$response" | jq -e '.id' >/dev/null 2>&1; then
    echo "  ✅ $email"
    ((sent++))
  else
    echo "  ♤ $email — $(echo "$response" | jq -r '.message // .error // "unknown error"')"
    ((failed++))
  fi
done

echo ""
echo "🔂 Bults: $sent sent, $failed failed out of $count"

if [[ $sent -gt 0 ]]; then
  # Mark as sent to prevent double-sends
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  wrangler kv key put \
    --namespace-id "$KV_NAMESPACE_ID" \
    "$SENT_MARKER_KEY" \
    "sent_at=$timestamp,count=$sent" 2>/dev/null
  echo "✅ Marked launch email as sent (key: $SENT_MARKER_KEY)"
fi
