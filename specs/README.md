# Specs

This directory holds the project specs in SDD format. Each phase or relevant fix
must have a folder with three files:

```txt
specs/<name>/
  requirements.md
  design.md
  tasks.md
```

## Statuses

- `pending`: not yet implemented.
- `active`: currently being implemented.
- `blocked`: waiting on a decision, data, API, design, or contract to proceed.
- `in_review`: implementation complete, waiting on gates, PR, or human review.
- `completed`: closed and validated.
- `deferred`: intentionally postponed without being closed as completed.
- `historical`: kept as decision memory; does not represent current architecture.

## Recommended Metadata

New specs must start `requirements.md` with frontmatter:

```yaml
---
status: pending
phase:
owner: cristian
branch:
pr:
preview:
gates:
  spec_review: pending
  grill: pending
  analyst: not_applicable
  design: not_applicable
  data_contract: not_applicable
  security: not_applicable
  qa: pending
  code_quality: pending
  reviewer: pending
---
```

Valid values for `status`: `pending`, `active`, `blocked`, `in_review`,
`completed`, `deferred`, `historical`.

Valid values for gates: `pending`, `passed`, `failed`, `blocked`,
`not_applicable`.

## How to Use a Spec

1. Read `requirements.md` to understand the problem, objective, and success criteria.
2. Read `design.md` to understand architecture, contracts, risks, and decisions.
3. Execute `tasks.md` as an agent-by-agent checklist.
4. Link the spec in the PR.
5. Copy or summarize the acceptance criteria in the PR template.
6. Update status/tasks if scope changes during implementation.
7. Update this README if a spec is created, renamed, closed, or changes status.
8. Run `pnpm spec:check` before opening a PR.

## Phase Index

| Phase | Spec | Status |
| --- | --- | --- |
| 0 | `phase-00-setup` | completed |
| 1 | `phase-01-ingesta-db` | completed |
| 2 | `phase-02-modelo-prediccion` | completed |
| 3 | `phase-03-refresh-demanda` | completed / partial historical |
| 4 | `phase-04-dashboard` | completed |
| 5 | `phase-05-pulido` | completed |
| 6 | `phase-06-diseno-broadcast` | completed |
| 7 | `phase-07-branding-world-cup` | completed |
| 8 | `phase-08-datos-historicos` | completed |
| 9 | `phase-09-cloudflare-d1` | historical |
| 10 | `phase-10-hardening-auth` | completed |
| 11 | `phase-11-deploy-vercel-isr` | completed |
| 12 | `phase-12-datos-historicos-enriquecidos` | completed |
| 13 | `phase-13-predicciones-fixture-cards` | completed |
| 14 | `phase-14-sistema-visual-design` | completed |
| 15 | `phase-15-espanol-glosario` | completed |
| 16 | `phase-16-goleadores-mercados` | completed |
| 17 | `phase-17-odds-implicitas` | completed |
| 18 | `phase-18-jugadores-lineups` | completed |
| 19 | `phase-19-picks` | completed |
| 20 | `phase-20-accuracy` | completed |
| 21 | `phase-21-bracket` | completed |
| 22 | `phase-22-mis-picks` | completed |
| 23 | `phase-23-share-card` | completed |
| 24 | `phase-24-team-page` | completed |
| 25 | `phase-25-match-context` | completed |
| 26 | `phase-26-picks-reminder` | completed |
| 27 | `phase-27-live-top-scorers` | completed |
| 28 | `phase-28-i18n` | pending |
| 29 | `phase-29-portfolio-rebrand` | pending |

## Infrastructure / Fix Specs

| Spec | Status | Description |
| --- | --- | --- |
| `auto-refresh-workers` | historical | Historical exploration of Cloudflare Workers / next-on-pages. |
| `vercel-env-csp` | historical | Diagnosis and fixes for env vars / CSP issues on Vercel. |
| `fix-better-sqlite3-devdep` | completed | Add serverExternalPackages to eliminate DEP0176 warning on Vercel. |
| `fix-goleadores-empty-state` | completed | Show real scorers with static squads for all 32 teams. |
| `fix-flags-display` | completed | Remove player flags in Golden Boot; add missing flags (Cape Verde Islands, Jordan, Congo DR). |

## Rules

- Do not implement a new phase without a linked spec.
- Do not use a historical spec as current guidance without creating a new reactivation spec.
- If the PR deviates from the spec, update the spec or explain the change in the PR.
- If a spec's status changes, update this README in the same PR.
- If a new phase/spec is added, add it to the index in this README before requesting review.
- Specs do not replace tests or review; they are an intent and acceptance contract.
- New specs must use YAML metadata.
- `completed` implies tasks are closed or exceptions are documented.
- `blocked` must include the specific blocker and who/what unblocks it.
- `in_review` means implementation is finished and gates, preview, or PR are still pending.
