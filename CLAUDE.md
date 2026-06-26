# CLAUDE.md — World Cup 2026 Prediction Simulator

## What it is

An app that projects statistical markets for the 2026 World Cup using a proprietary model.
Framing: "how AI predicts the World Cup". It is entertainment analysis, not a betting platform:
it only shows probabilities, context, and explanations; it does not accept or process bets.

## Current stack

- Next.js 16 App Router + React + TypeScript.
- Tailwind CSS.
- Vitest for tests.
- Vercel ISR in production.
- `main` deploys to production on Vercel.
- PRs generate Vercel preview deployments.
- Fixtures loaded at server runtime from football-data.org via `FOOTBALLDATA_KEY`.
- API-Football/RapidAPI reserved for enriched endpoints: lineups, injuries, events, stats, and fallback when applicable.
- Tournament Monte Carlo stays precomputed in `lib/data/tournament-prediction.json`.
- SQLite/better-sqlite3 stays for local scripts and project history; must not enter the Vercel runtime.

## Layer harness

Dependencies flow in one direction only. No layer may import from a layer above it.

```txt
UI  <-  Agents  <-  Models  <-  Skills
      (I/O)       (math)      (pure fn)
```

### Skill contract

- Pure function: `(input: T) => U`.
- No imports from `lib/db`, `lib/data`, providers, env vars, or the network.
- No `fetch`.
- No mutable global state.
- Testable in isolation with Vitest and no complex mocks.

### Model contract

- Receives already-normalized data as arguments.
- Never calls external APIs.
- Never instantiates DB.
- Returns `ModelOutput` or derived contracts documented by Analyst.
- Includes sanity checks for probabilities and ranges.

```ts
interface ModelOutput {
  market: MarketType
  probabilities: Record<string, number>
  confidence: 'high' | 'medium' | 'low'
  modelVersion: string
  computedAt: string
}
```

### Agent contract

- The only layer authorized to call external APIs, read server-side env vars, use runtime cache, and run data scripts.
- May call models with normalized data.
- May read precomputed JSON if it is a versioned source of truth.
- Must degrade gracefully with a fallback when an API does not respond.
- Must keep API keys server-side; never use `NEXT_PUBLIC_` for secrets.

### UI contract

- Server Components by default.
- Client Components only for small interactions.
- Client Components do not import `lib/model`, `lib/db`, providers, or env vars.
- The UI consumes ready-to-render data from agents/server loaders.

## Available agents

Invoke with `Agent({ subagent_type: ... })` or let Claude orchestrate based on the task:

- **analyst**: designs model contracts, validates math, probabilities, lambdas, overround, and market technical copy.
- **design**: defines and reviews visual direction, UX, responsive behavior, visual microcopy, hierarchy, and consistency.
- **developer**: implements following specs and the harness.
- **qa**: writes/runs tests, validates sanity checks, main routes, and build.
- **code-quality**: reviews code best practices, maintainability, typing, simplicity, and duplication.
- **reviewer**: audits layers, contracts, conventions, and spec-to-implementation consistency.
- **security**: audits secrets, OWASP, CSP, server runtime, quotas, and API exposure.

## Spec Driven Development

Every phase or relevant fix must have a spec before or during the PR:

```txt
specs/<name>/
  requirements.md
  design.md
  tasks.md
```

Statuses used:

- `pending`: not yet implemented.
- `active`: in implementation.
- `blocked`: a decision, datum, API, design, or contract is missing before work can proceed.
- `in_review`: implementation is ready, waiting on gates, PR, or human review.
- `completed`: closed.
- `deferred`: consciously postponed.
- `historical`: a prior decision kept as context, not current architecture.

The PR must link its spec and mark the reviewed acceptance criteria.

Whenever a spec is created, renamed, closed, or changes status, update `specs/README.md`
in the same PR. That README is the live SDD roadmap index.

New specs must include YAML metadata in `requirements.md` with status, owner, branch, PR,
preview, and gate status. Historical specs may be migrated gradually, but every new spec
must follow the `spec-init` template.

### Definition of Ready

A spec is ready for implementation when:

- Objective, scope, and out-of-scope are clear.
- Requirements are verifiable.
- Acceptance criteria can be copied or summarized into the PR.
- Data contracts are defined if there are APIs, JSON, models, odds, lineups, or cache involved.
- Risks and assumptions are documented.
- Required agents are identified per the gate matrix.
- `spec-review` has no blockers.

### Definition of Done

A spec may be closed when:

- Tasks and acceptance criteria are complete or explicitly deferred.
- The implementation respects `design.md` or documents deviations.
- `specs/README.md` is updated if status, name, or scope changed.
- `pnpm spec:check` passes.
- Applicable checks were executed or documented as skipped with a reason.
- Applicable gates are approved.
- PR template is complete.
- Vercel preview was reviewed if the change touches UI, routes, runtime, ISR, or data.

### Gate matrix

| Change type | Required gates |
| --- | --- |
| UI / visual copy | Design, QA, Code Quality, Reviewer |
| Model / probabilities | Analyst, Grill, QA, Code Quality, Reviewer |
| API / runtime / env / cache | Data Contract, Grill, Security, QA, Reviewer |
| JSON data / precompute | Analyst if model changes, QA, Code Quality, Reviewer |
| Security / CSP / auth | Security, QA, Reviewer |
| Docs / specs only | Spec Review, `pnpm spec:check`, Reviewer optional |
| Product fix | Spec Review, Grill if applicable, QA, Code Quality, Reviewer |
| Architectural decision | ADR, Spec Review, Reviewer |

ADR is required if runtime, data source, storage, mathematical model, cache, auth, or
external provider changes.

### SDD skills

Use these skills to keep the spec-driven flow consistent:

- `.claude/skills/spec-init.md`: create or normalize specs and update `specs/README.md`.
- `.claude/skills/spec-review.md`: review that a spec is ready before implementation.
- `.claude/skills/data-contract.md`: define data contracts for APIs, JSON, models, markets, odds, lineups, and ISR.
- `.claude/skills/adr.md`: document important technical decisions in `docs/adr/`.
- `.claude/skills/task-runner.md`: implement a concrete task without exceeding the spec scope.
- `.claude/skills/spec-closeout.md`: close a spec before the PR.
- `.claude/skills/pr-prep.md`: prepare the PR body from the spec, diff, checks, and gates.

Recommended flow:

1. `spec-init` when no spec exists or needs normalizing.
2. `spec-review` before moving to implementation.
3. `data-contract` if data, APIs, models, markets, odds, lineups, or cache change.
4. `adr` if a technical decision with architectural impact is made.
5. `grill` before implementing if applicable.
6. Pre-implementation agents when applicable: Analyst for model/probabilities/technical copy, Design for UI/UX/visual copy, Security for APIs/env vars/CSP/runtime/sensitive data.
7. `task-runner` to execute a scoped task with Developer.
8. Post-implementation agents: QA, Code Quality, Reviewer, and Design/Security re-checks if applicable.
9. `spec-closeout` when the implementation is ready.
10. `grill` re-check if applicable.
11. `pr-prep` before opening the PR.
12. `commit` skill to create standard commits when changes are ready.

Agents do not replace skills: skills order the process; agents validate quality from their specialty.

## Grill Gate

The skill `.claude/skills/grill.md` is required for phases, product fixes, new markets,
model changes, external APIs, and runtime changes.

Recommended usage:

1. **Before implementing**: run Grill to detect blockers in data, contracts, harness, tests, and risks.
2. **Before opening a PR**: run a short Grill re-check to confirm blockers are resolved or risks are documented.

If Grill ends with `DO NOT START`, do not pass to Developer until blockers are resolved or
the spec is updated.

## Commit Gate

The skill `.claude/skills/commit.md` is required whenever creating a commit.
All commits must follow Conventional Commits:

```txt
<type>: <description>
```

Key rules:

- Message in English.
- Single line.
- No body, footer, or `Co-Authored-By`.
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`.
- No scope (no parentheses after the type).
- The skill may run `git add` and create the commit. It must inspect `git status`/diff before staging.
- Prefer `git add <files>`; use `git add -A` only if all reviewed changes belong to the same request.
- Never stage secrets, local files, caches, or builds.

## Conventions

- Implement from the inside out: Skills → Models → Agents → UI.
- Do not design statistical logic in Developer without an Analyst contract.
- Do not mix different phases in the same PR.
- Do not use `npm` or `yarn`; use `pnpm`.
- Keep secrets out of the repo and the client bundle.
- When precomputed data changes, explain which script was run and why the JSON changed.
- Stateless components must be Server Components.

## Design

The app targets viral content: it must not look like a generic template. Visual north:
sports data terminal / broadcast style, data first, large numbers, dark background,
controlled accents, custom visualizations, and clear language in Spanish LATAM.
Phase 28 will add an English/Spanish toggle.

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm tsc --noEmit
pnpm build
pnpm precompute
pnpm refresh-fixtures
```

## Pre-close checklist for a phase

1. Analyst approved, if model, formula, probabilities, or technical copy changed.
2. Design approved, if UI or visual copy changed.
3. Grill initial report with no blockers, or blockers resolved in the spec.
4. `specs/README.md` updated if a spec or its status changed.
5. `pnpm tsc --noEmit`.
6. `pnpm test`.
7. `pnpm build`.
8. `pnpm spec:check`.
9. QA approved.
10. Code Quality with no blockers.
11. Reviewer with no blockers.
12. Security with no criticals.
13. Grill re-check before the PR if there was a new model, API, runtime, or market.
14. Vercel preview reviewed by the owner if the change touches UI, routes, runtime, ISR, or data.

No phase is considered done if an applicable gate fails.

## Git flow and production

`main` is connected to production on Vercel. Do not work on new phases directly on `main`.

Default flow:

1. Update `main` and create a short branch: `phase/<number>-<description>` or `fix/<description>`.
2. Use `spec-init` if a spec is missing and update `specs/README.md`.
3. Use `spec-review` to validate the spec is ready.
4. Use `data-contract` if data, APIs, models, markets, odds, lineups, or cache change.
5. Create/update ADR with `adr` if there is a relevant technical decision.
6. Run Grill before implementing when applicable.
7. Invoke pre-implementation agents when applicable:
   Analyst for model/probabilities/technical copy, Design for UI/UX/visual copy,
   Security for APIs/env vars/CSP/runtime/sensitive data.
8. Implement a small, verifiable scope with `task-runner` and Developer.
9. Run post-implementation gates: QA, Code Quality, Reviewer, and Design/Security re-checks if applicable.
10. Run `spec-closeout` and Grill re-check before the PR when applicable.
11. Prepare the PR with `pr-prep`.
12. Use the Commit skill to create standard commits when changes are ready.
13. Open PR toward `main` using `.github/pull_request_template.md`.
14. Review the Vercel preview deployment.
15. Wait for human approval from the owner.
16. Merge to `main`.
17. If production fails, revert the PR or use Vercel rollback.

Rules:

- `main` must always be deployable.
- No direct pushes to `main` for product phases.
- Do not mix different phases in the same PR.
- Split large phases into small vertical PRs.
- Complete the PR template before requesting review.

## Correction cycle

1. **QA fails**: Developer fixes if it is an implementation issue; Analyst redefines if it is statistical logic.
2. **Design blocks**: Developer adjusts UI/copy; QA validates that build/routes are not broken; Design re-validates.
3. **Code Quality blocks**: Developer fixes the blocking debt or bad practice; Code Quality re-validates.
4. **Reviewer blocks**: Developer fixes the harness violation; Reviewer re-validates.
5. **Security reports a critical**: Developer fixes; Security re-audits.
6. When all applicable gates say approved, the phase may advance.
