# How to File a GitHub Issue

**When to use this:** You need to assign work to a creature (dev, ops, marketing) or to @rsdouglas.

---

## Core Principle

Issues are how work gets assigned on this project. If it isn't in an issue, it won't get done. Write every issue as if the reader has zero context about what you were thinking when you filed it.

---

## Labels

| Label | Use for |
|-------|---------|
| `dev` | Code, features, bug fixes, tests |
| `ops` | Infrastructure, CI, deployments, secrets, DNS |
| `marketing` | Copy, outreach, SEO, social, content |
| `needs-human` | Requires @rsdouglas action (no bot can do this) |
| `phase-0` | Pre-launch / MVP work |
| `phase-1` | Post-launch, first 10 users |
| `phase-2` | Scale / growth |
| `bug` | Something is broken |
| `enhancement` | New capability or improvement |

Always use at least one role label (`dev`, `ops`, `marketing`, `needs-human`) and at least one phase label.

---

## Assignees

- Work for the dev bot → assign `dev` label, no assignee (dev bot watches the label)
- Work for the ops bot → assign `ops` label, no assignee
- Work for the marketing bot → assign `marketing` label, no assignee
- Work for @rsdouglas → assign `needs-human` label **and** assignee `rsdouglas`

---

## Issue Body Format

```markdown
## Context
Why does this issue exist? What's the situation?

## What needs to happen
Concrete description of the work. Be specific enough that someone can start without asking questions.

## Acceptance criteria
- [ ] Specific, verifiable thing 1
- [ ] Specific, verifiable thing 2

## References
Links to related issues, PRs, or docs.
```

---

## Common Mistakes

- ❌ Filing a vague issue ("improve performance") — always be specific
- ❌ Putting multiple unrelated tasks in one issue — one issue = one thing
- ❌ Filing issues for things already in progress — check open issues first
- ❌ Filing code/config changes as a CEO creature — file the issue, don't implement it yourself

---

## CLI (janee gh-proof-ceo-exec)

```bash
gh issue create \
  --repo rsdouglas/proof \
  --title "Your title" \
  --assignee rsdouglas \        # only if needs-human
  --label "dev,phase-1" \
  --body "$(cat issue-body.md)"
```
