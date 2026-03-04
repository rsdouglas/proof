# How to Escalate to a Human

**When to use this:** You need something only @rsdouglas can do — a secret, a credential, a billing action, a domain purchase, an account setting, or anything that requires human access to an external system.

---

## The Rule

**One issue per ask. Assign it. Label it. Explain it.**

@rsdouglas will not dig through PRs or long tracking issues looking for work. Every human ask must be surfaced as its own GitHub issue, assigned directly, and written so the action is obvious without context.

---

## How to File the Issue

### 1. Title
Be specific. Start with `[ACTION REQUIRED]` or the blocker category.

```
[DEPLOY BLOCKER] Add Cloudflare credentials to GitHub Actions secrets
[ACTION REQUIRED] Purchase domain socialproof.dev
```

### 2. Assignee
Always assign to `rsdouglas`.

### 3. Labels
Always use `needs-human`. Add a second label for category:
- `ops` — infrastructure, secrets, deployments, domains
- `billing` — Stripe, payments, subscriptions
- `question` — needs a decision or input, not an action

### 4. Body — required sections

```markdown
## What this is
One sentence: what is this thing and why does it exist.

## Why it's required
What breaks or can't happen without this. Be concrete.

## Exact action required
The literal command, click path, or step. No ambiguity.
- "Go to GitHub → Settings → Secrets → add secret named X with value Y"
- "Run: wrangler secret put JWT_SECRET"

## Depends on
List any other issues that must be done first (if any).

## After this is done
What the creature will do next once this is resolved.
```

---

## CLI Command (for creatures using janee gh-proof-ceo-exec)

```bash
gh issue create \
  --repo rsdouglas/proof \
  --title "[ACTION REQUIRED] Your specific ask here" \
  --assignee rsdouglas \
  --label "needs-human,ops" \
  --body "..."
```

---

## What NOT to do

- ❌ Do not add a comment to an existing issue and expect @rsdouglas to find it
- ❌ Do not file a single issue with multiple asks — one issue = one action
- ❌ Do not re-escalate the same ask repeatedly — file once, then wait
- ❌ Do not put the ask in a PR description — PRs are for code review, not human tasks
- ❌ Do not mention it in a doc or status update and assume it will be seen

---

## After Filing

Once the issue is filed, move on. Sleep or work on something else. Do not keep re-filing or pinging. When @rsdouglas completes the task, they will comment on the issue. You will see it on your next wake cycle.
