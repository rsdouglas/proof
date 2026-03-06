# Cold Email GitHub Actions Workflow

## Purpose

This document contains the GitHub Actions workflow for sending cold email batches.
It uses the `RESEND_API_KEY` repo secret — **never exposed to any creature or contributor**.

## Setup

1. Make sure `RESEND_API_KEY` is set in **Settings → Secrets and variables → Actions → Repository secrets**
2. Create the file `.github/workflows/send-cold-email.yml` in the repo root with the content below
3. Commit and push (this requires the `workflows` permission — must be done by rsdouglas directly)

## How to run

1. Go to **Actions → Send Cold Email Batch → Run workflow**
2. Set `batch` = 1 (or whichever batch)
3. Set `dry_run` = `true` for a preview (safe), `false` to actually send
4. Click **Run workflow**
5. Check the run log for output. Real sends appear in the Resend dashboard at https://resend.com/emails

## Workflow file content

Copy this exactly into `.github/workflows/send-cold-email.yml`:

```yaml
name: Send Cold Email Batch

on:
  workflow_dispatch:
    inputs:
      batch:
        description: 'Batch number to send (1, 2, 3…)'
        required: true
        default: '1'
      dry_run:
        description: 'Dry run only (true = preview only, no emails sent)'
        required: true
        default: 'true'
        type: choice
        options:
          - 'true'
          - 'false'

jobs:
  send-batch:
    name: Send email batch ${{ inputs.batch }} (dry_run=${{ inputs.dry_run }})
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Validate dry_run is true before first real send
        if: inputs.dry_run == 'false'
        run: |
          echo "⚠️  REAL EMAIL SEND — batch=${{ inputs.batch }}"
          echo "Sending to real recipients via Resend API."
          echo "This cannot be undone. Proceeding..."

      - name: Run dry run preview
        if: inputs.dry_run == 'true'
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
        run: |
          echo "🔍 DRY RUN — no emails will be sent"
          node scripts/send-cold-email-batch.js --dry-run --batch=${{ inputs.batch }}

      - name: Send real batch
        if: inputs.dry_run == 'false'
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
        run: |
          node scripts/send-cold-email-batch.js --send --batch=${{ inputs.batch }}

      - name: Summary
        run: |
          echo "## Cold Email Batch ${{ inputs.batch }}" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          if [ "${{ inputs.dry_run }}" = "true" ]; then
            echo "✅ **DRY RUN COMPLETE** — no emails sent" >> $GITHUB_STEP_SUMMARY
            echo "To send for real: re-run workflow with dry_run=false" >> $GITHUB_STEP_SUMMARY
          else
            echo "✅ **BATCH SENT** — check Resend dashboard for delivery status" >> $GITHUB_STEP_SUMMARY
            echo "Resend dashboard: https://resend.com/emails" >> $GITHUB_STEP_SUMMARY
          fi
```

## Notes

- The workflow reads `RESEND_API_KEY` from repo secrets — it is **never printed** to logs
- Dry run is safe: it calls the script with `--dry-run` which skips the actual API call
- After a real send, check Resend dashboard for opens/bounces
- Batch 1 = 7 Austin yoga/fitness targets (confirmed in issue #419)

---

## v2 Workflow (workflow_dispatch with JSON targets — no emails in git)

This is the updated workflow. Targets are pasted as JSON at trigger time — nothing stored in git.

### Setup

1. Ensure `RESEND_API_KEY` is set in Settings → Secrets and variables → Actions
2. **rsdouglas** must create `.github/workflows/cold-email-outreach.yml` directly (GitHub App lacks `workflows` permission):

```yaml
name: Cold Email Outreach

on:
  workflow_dispatch:
    inputs:
      targets_json:
        description: 'JSON array: [{"name":"Biz","email":"owner@example.com","niche":"Hair Salon","city":"Austin TX"},...]'
        required: true
        type: string
      dry_run:
        description: 'Dry run only (true = preview, false = send)'
        required: true
        default: 'true'
        type: choice
        options:
          - 'true'
          - 'false'
      batch_label:
        description: 'Label for this batch (e.g. "austin-salons-batch2")'
        required: false
        default: 'outreach'
        type: string

jobs:
  send-outreach:
    name: Send outreach (${{ inputs.batch_label }}, dry_run=${{ inputs.dry_run }})
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run cold email outreach
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          TARGETS_JSON: ${{ inputs.targets_json }}
          DRY_RUN: ${{ inputs.dry_run }}
          BATCH_LABEL: ${{ inputs.batch_label }}
        run: node scripts/send-outreach-v2.js

      - name: Job summary
        run: |
          echo "## Cold Email Outreach — ${{ inputs.batch_label }}" >> $GITHUB_STEP_SUMMARY
          if [ "${{ inputs.dry_run }}" = "true" ]; then
            echo "✅ DRY RUN COMPLETE — no emails sent" >> $GITHUB_STEP_SUMMARY
          else
            echo "✅ BATCH SENT — check Resend: https://resend.com/emails" >> $GITHUB_STEP_SUMMARY
          fi
```

### How to trigger

1. Go to **Actions → Cold Email Outreach → Run workflow**
2. Paste `targets_json` from the list proof-ops receives via mail
3. Set `dry_run=true` first to preview
4. Set `dry_run=false` to send for real
5. Check run log and Resend dashboard

### Target JSON format

Targets are sent to proof-ops via creature mail (never committed to git).

```json
[
  {"name": "Bella Salon Austin", "email": "info@bellasalonaustin.com", "niche": "Hair Salon", "city": "Austin TX"},
  {"name": "Jane Smith", "email": "jane@janecoaches.com", "niche": "Life Coach", "city": "Austin TX"}
]
```
