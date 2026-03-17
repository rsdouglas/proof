# Outreach SOP

This is the canonical operating procedure for Proof cold outreach.

## Purpose

Use the admin outreach pipeline to:
- load targets into D1
- review pending targets
- send a controlled batch through the Worker
- inspect batch stats/status before and after sends

This keeps contact lists out of git and makes outreach auditable through the existing admin API.

## Rules

- Never commit contact lists or email addresses to the repository.
- Use `Authorization: Bearer $ADMIN_TOKEN` for admin API calls.
- Run `GET /api/admin/status` before sending any batch.
- If `ok=false`, stop and fix critical health checks first.
- If `has_warnings=true`, review the warning checks before deciding to proceed.
- Prefer small batches and verify results before sending more.

## Endpoints

- `GET /api/admin/status`
- `POST /api/admin/outreach/targets`
- `GET /api/admin/outreach/targets`
- `GET /api/admin/outreach/stats`
- `POST /api/admin/outreach/send`

Base URL:

```bash
export PROOF_API_BASE="https://api.socialproof.dev"
```

## 1) Check admin status

```bash
curl -s "$PROOF_API_BASE/api/admin/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

Interpretation:
- `ok=true` means critical systems are healthy
- `has_warnings=true` means optional integrations have issues; read `checks.*.error`

## 2) Load targets into D1

Prepare a local JSON file that is **not committed**:

```json
{
  "targets": [
    {
      "email": "owner@example.com",
      "name": "Sam",
      "business_name": "Sam's Plumbing",
      "vertical": "plumber",
      "variant": "v1"
    }
  ]
}
```

Upload:

```bash
curl -s "$PROOF_API_BASE/api/admin/outreach/targets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  --data @targets.json | jq
```

## 3) Review pending targets

```bash
curl -s "$PROOF_API_BASE/api/admin/outreach/targets" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

## 4) Check outreach stats

```bash
curl -s "$PROOF_API_BASE/api/admin/outreach/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

Use this to confirm current pending/sent/error counts before sending.

## 5) Send a small batch

```bash
curl -s "$PROOF_API_BASE/api/admin/outreach/send" \
  -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit":10}' | jq
```

Suggested practice:
- start with `limit: 5` or `10`
- inspect stats/results
- only then send the next batch

## 6) Verify outcome

Re-run stats after the batch:

```bash
curl -s "$PROOF_API_BASE/api/admin/outreach/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

Also inspect provider-side results if relevant.

## Failure handling

- 401: wrong or missing `ADMIN_TOKEN`
- `ok=false` on `/api/admin/status`: do not send; fix critical integration failures first
- send errors in outreach results: pause, inspect the error text, and avoid retry loops

## Notes for agents

- Old custom admin headers are obsolete.
- The canonical admin contract is Bearer auth plus `/api/admin/*` routes.
- The D1-backed outreach pipeline is preferred over ad hoc one-off send scripts.
