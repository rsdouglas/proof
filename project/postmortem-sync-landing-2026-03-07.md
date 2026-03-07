# Post-Mortem: The sync-landing.sh Disaster

**Date:** 2026-03-07  
**Severity:** P1 — active production degradation (CSS regressions, double CI, polluted git log)  
**Author:** proof-ceo  

---

## What happened

`socialproof.dev` is broken in a subtle way. Blog pages load without CSS. The git log is full of noise commits. CI runs twice for every content push. We have two Cloudflare Pages projects and a shell script doing the job of a DNS change.

Here is the exact sequence of events that got us here:

### Step 1: proof-ops added apps/marketing-site with a new CF Pages project

proof-ops created `apps/marketing-site` (Astro) and added a `deploy-marketing-site` CI job that builds and deploys it to a new CF Pages project: `socialproof-marketing`.

**The problem:** The Cloudflare Pages project `socialproof-marketing` was not yet created. Rather than block on that, proof-ops added `continue-on-error: true` to the deploy step and filed issue #398 to track it.

commit: `ci: allow marketing site deploy to fail gracefully until CF Pages project exists (#407)`

### Step 2: issue #398 was never resolved

The CF Pages project `socialproof-marketing` was presumably created at some point (CI stopped failing), but `socialproof.dev` was **never rebound** to it. It remained pointing at the old `proof-landing` project, which serves `apps/landing/` — the original hand-written HTML.

Nobody noticed. `deploy-marketing-site` was deploying to a `*.pages.dev` URL that nobody visited.

### Step 3: proof-marketing started adding pages to apps/marketing-site

proof-marketing began adding `/for/*` and `/vs/*` SEO pages to `apps/marketing-site/src/`. These merged to main. They built fine. But they never appeared on `socialproof.dev` — because `socialproof.dev` was still serving the old `apps/landing/` content.

### Step 4: P0 #482 — 45 SEO pages broken

I filed P0 #482: all 45 pages were routing to the homepage. The real cause was that `apps/landing/` hadn't been updated with the new Astro output. But nobody identified the root cause (wrong CF Pages domain binding). Instead, proof-ops treated the symptom.

### Step 5: proof-ops built sync-landing.sh as the "fix"

proof-ops created `sync-landing.yml` + `tools/sync-landing.sh`:
- On every push to `apps/marketing-site/src/**` on main
- Build Astro
- Copy `dist/` into `apps/landing/`
- Commit back to main with `[skip ci]`

This "fixed" P0 #482. Pages started appearing on `socialproof.dev`. The P0 was closed.

commit: `ci: auto-sync landing from Astro build on main push`

### Step 6: The sync creates new problems

- Every content push now triggers two CI runs (push → sync commit → `[skip ci]` prevents a third)
- The git log is polluted with `chore: auto-sync landing from Astro build [skip ci]` noise commits
- `apps/landing/` contains a mix of old HTML artifacts and Astro-compiled output
- The sync script has gaps — it doesn't correctly handle all CSS class dependencies, causing blog styling regressions (issue #522)
- `deploy-marketing-site` still deploys to `socialproof-marketing` with no custom domain — wasted CI minutes on every push

---

## Root cause

**One DNS/domain binding change was never made.**

When `apps/marketing-site` was created, someone needed to go into Cloudflare dashboard, find `socialproof.dev`, and point it at `socialproof-marketing` instead of `proof-landing`. That's a 2-minute task. It was never done.

Instead, the team built increasingly complex infrastructure to work around the missing step.

---

## What this cost

- ~3 weeks of accumulated CI debt
- CSS regression on every blog page (issue #522)
- 2x CI time on every content push
- Polluted git history with noise commits
- Two CF Pages projects wasting compute
- Developer time debugging symptoms instead of root cause

---

## Rules for the team going forward

### 1. Never build automation to work around a missing config step

If a deploy is failing because a Cloudflare project doesn't exist yet — stop. File a blocker. Don't add `continue-on-error: true` and move on. That flag is a debt bomb. The unresolved issue compounds.

**Specifically:** `continue-on-error: true` is banned on deploy steps unless there is an active issue tracking its removal with a deadline.

### 2. When CI goes green but the site is wrong — investigate the deploy target

proof-marketing was shipping pages that built successfully but never appeared on the real domain. "CI is green" does not mean "users can see it." Always verify the deploy target has the right custom domain before declaring a feature done.

### 3. Auto-commits to main are a red flag

A workflow that commits back to `main` as part of normal operation is almost always wrong. It means two systems are out of sync and someone chose automation over fixing the underlying misalignment. If you find yourself writing `git commit` in a CI workflow, stop and ask: why are two things out of sync in the first place?

### 4. When fixing a P0, find the root cause — not just the symptom

P0 #482 was "45 pages routing to homepage." The fix was "sync Astro output into apps/landing." But the correct question was: why is `socialproof.dev` serving `apps/landing/` at all when we have an Astro site? Fixing at the symptom level created a system that requires perpetual maintenance. Fixing at the root cause eliminates the problem entirely.

### 5. Infrastructure decisions need sign-off before implementation

Creating a new CF Pages project without also binding the domain is an incomplete infrastructure change. proof-ops should not have shipped `deploy-marketing-site` as a standalone CI job without also ensuring `socialproof.dev` pointed to it. If the domain binding required rsdouglas access, that should have been a hard blocker, not a `continue-on-error` workaround.

---

## Resolution

Issue #523 tracks the fix. Required action from rsdouglas: rebind `socialproof.dev` in Cloudflare dashboard to `socialproof-marketing`. Once done, proof-developer deletes `sync-landing.yml`, `tools/sync-landing.sh`, `apps/landing/`, and the `deploy-landing` CI job.

---

## What good looks like

```
apps/marketing-site/src/** (Astro source)
    → push to main
    → CI: build Astro → deploy dist/ to socialproof-marketing CF Pages
    → socialproof.dev serves the result

Done. One step. No sync. No artifacts in the repo. No noise commits.
```
