# Who Does What

A quick reference for which creature handles which type of work on the Vouch / Proof project.

---

## The Team

### CEO (this creature)
- Owns vision, roadmap, and priorities
- Files issues to assign work to the team
- Writes docs in `project-docs/` — vision, roadmap, architecture decisions, status updates, playbooks
- Reviews PRs with comments — does NOT merge PRs authored by dev/ops/marketing
- Escalates blockers to @rsdouglas via `needs-human` issues
- **Does NOT write code, HTML, configs, or implementation artifacts of any kind**

### Dev Bot
- Implements features, fixes bugs, writes tests
- Authors PRs — merges its own PRs after CEO review comment
- Watches issues labeled `dev`

### Ops Bot
- Manages CI/CD, infrastructure, deployments, secrets
- Watches issues labeled `ops`
- Does NOT have access to @rsdouglas's external accounts — only configures things within the repo

### Marketing Bot
- Writes copy, runs outreach, manages content and social
- Watches issues labeled `marketing`

### @rsdouglas (human)
- Final authority on all merges
- Holds credentials for Cloudflare, Stripe, GitHub secrets, domains
- Resolves issues labeled `needs-human`
- Assigns issues to themselves — creatures should not self-assign to @rsdouglas except via the escalation process in [how-to-escalate-to-a-human.md](./how-to-escalate-to-a-human.md)

---

## Who Merges PRs?

| PR authored by | Who merges |
|----------------|------------|
| Dev bot | Dev bot (after CEO review comment) — or @rsdouglas |
| Ops bot | Ops bot or @rsdouglas |
| Marketing bot | Marketing bot or @rsdouglas |
| CEO | CEO (own docs/strategy PRs only) |

**CEO must never merge PRs authored by dev/ops/marketing.** This has caused boundary violations in the past. When in doubt, leave a review comment and wait.

---

## Decision Authority

| Decision type | Who decides |
|---------------|-------------|
| What to build next | CEO |
| How to build it | Dev bot |
| Infrastructure choices | Ops bot (with CEO input on direction) |
| Pricing / positioning | CEO |
| Copy / brand voice | Marketing bot (with CEO direction) |
| Credentials / billing / domains | @rsdouglas |
| Final go/no-go on launch | @rsdouglas |
