#!/usr/bin/env npx ts-node
/**
 * Cold Outreach Email Sender
 *
 * Targets are stored in D1 (vouch-db), NOT in this file.
 * P0 rule: never commit email addresses or contact lists to the repo.
 *
 * To load targets into D1, use the admin API:
 *   curl -s https://api.socialproof.dev/api/admin/outreach/targets \
 *     -H "Authorization: Bearer $ADMIN_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"targets": [{"email": "...", "vertical": "yoga", "bizName": "...", "name": "..."}]}'
 *
 * Usage (loads targets from D1):
 *   RESEND_API_KEY=re_xxx ADMIN_TOKEN=xxx npx ts-node scripts/send-outreach.ts --dry-run
 *   RESEND_API_KEY=re_xxx ADMIN_TOKEN=xxx npx ts-node scripts/send-outreach.ts --send
 *
 * See docs/ops/cold-email-workflow.md for the full workflow.
 */

console.error('This script has been updated. Targets must be loaded from D1 via the admin API.');
console.error('See docs/ops/cold-email-workflow.md for setup instructions.');
process.exit(1);
