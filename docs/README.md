# `docs/` vs `project-docs/`

This repo has two documentation homes on purpose:

- `docs/` = customer-facing product documentation and public-facing support content
- `project-docs/` = internal project documentation, playbooks, runbooks, strategy notes, ADRs, and working docs

## Put files in `docs/` when

The content is written for customers, prospects, or external users of SocialProof.
Examples:
- getting started / quickstart guides
- embedding instructions
- collecting testimonials
- public product guides and help content

## Put files in `project-docs/` when

The content is written for the team operating or building SocialProof.
Examples:
- deployment runbooks
- launch plans and distribution strategy
- internal status logs
- ADRs and architectural notes
- postmortems and activation analyses
- SOPs / playbooks / how-tos for internal operations

## Notes

- If a document teaches a customer how to use the product, it belongs in `docs/`.
- If a document explains how we run, build, ship, or decide things internally, it belongs in `project-docs/`.
- When in doubt, optimize for audience: external user → `docs/`; internal operator/builder → `project-docs/`.
