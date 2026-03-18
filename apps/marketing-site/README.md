# socialproof-marketing

Astro marketing site for `socialproof.dev`.

## Commands

Run from the repo root:

- `npm run build --workspace=apps/marketing-site` — build the marketing site
- `npm run dev --workspace=apps/marketing-site` — start Astro locally

Or from this directory:

- `npm run build`
- `npm run dev`
- `npm run preview`

## Notes

- Deploys are handled through the repo's GitHub Actions and Cloudflare Pages workflow.
- The old `apps/landing` sync workflow was removed after the repo consolidated on `apps/marketing-site`.
- The homepage can dogfood a real SocialProof widget when `PUBLIC_MARKETING_WIDGET_ID` is set in the Cloudflare Pages environment. If that variable is unset in production, the homepage intentionally falls back to the static testimonial cards in `src/pages/index.astro`.
- `scripts/post-deploy-smoke.sh` emits a non-failing `WARN [marketing-mode]` signal when production is still serving that static fallback, so deploy checks can distinguish "site up" from "homepage dogfood widget active".
