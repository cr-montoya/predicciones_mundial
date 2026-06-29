# World Cup 2026 Prediction Simulator

> AI-assisted statistical football analytics app &nbsp;·&nbsp; `v1.0.0`

Statistical projection engine for the 2026 FIFA World Cup. The app runs a custom
**Poisson + Monte Carlo** model to compute match outcome probabilities, market
projections, and tournament predictions — framed as: *"this is how the AI predicts
the World Cup"*.

This repository is shaped as a portfolio project for cloud, DevOps, and AI-assisted
engineering work: a production-style Next.js application with typed statistical
contracts, external data providers, ISR-friendly runtime boundaries, automated tests,
and a Spec Driven Development trail for feature planning and review.

It is an entertainment and analysis experience: it shows probabilities, context, and
explanations. It does not accept or process bets, and it makes no financial promises.

## Portfolio fit

This project complements my DevOps and Cloud Engineering profile by showing how I
approach application delivery beyond infrastructure alone:

- **System design:** clear boundaries between UI, runtime agents, statistical models,
  and pure skills.
- **Delivery discipline:** SDD specs, ADRs, gate reviews, tests, and PR-ready workflow
  documentation.
- **Runtime awareness:** Vercel ISR, API fallbacks, cacheable fixture data, and
  environment-variable isolation.
- **AI-assisted engineering:** an explicit agent orchestration process used to plan,
  validate, implement, and review scoped changes.
- **Product polish:** social preview images, localized UI copy, responsive views,
  predictions, picks, standings, and bracket exploration.

## What it does

- Projects **match markets** for every World Cup fixture: 1X2 result, over/under goals,
  both teams to score, exact score, clean sheets, cards, corners.
- Ranks **Golden Boot candidates** combining model probability with live goal counts.
- Simulates the **full tournament** via Monte Carlo to estimate championship probabilities.
- Shows **implicit odds** derived from model output.
- Tracks a user's **picks** (predictions) and measures accuracy over time.
- Renders an interactive **bracket** and **group standings** projection.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript |
| Testing | Vitest |
| Hosting | Vercel ISR |
| Live data | football-data.org (fixtures, scorers) |
| Enriched data | API-Football / RapidAPI (lineups, events, stats) |
| Prediction model | Custom Poisson distribution + Monte Carlo |

## GitHub presentation

Current repository metadata:

| Field | Value |
|---|---|
| Repository name | `wc2026-prediction-simulator` |
| Description | `AI-assisted World Cup 2026 analytics app with Poisson modeling, Monte Carlo simulation, ISR data loading, and SDD documentation.` |
| Homepage | `https://predicciones-mundial-topaz.vercel.app` |
| Topics | `nextjs`, `typescript`, `react`, `tailwindcss`, `vercel`, `football-data`, `monte-carlo`, `poisson`, `analytics`, `ai-assisted`, `sdd`, `portfolio` |

## Local Setup

```bash
pnpm install
cp .env.example .env.local   # fill in your API keys
pnpm dev
```

Required environment variables (server-side only — never expose with `NEXT_PUBLIC_`):

```
FOOTBALLDATA_KEY=<your football-data.org key>
RAPIDAPI_KEY=<your RapidAPI key, if using API-Football>
```

## Architecture

Dependencies flow in one direction only. No layer may import from a layer above it.

```
UI  ←  Agents  ←  Models  ←  Skills
     (I/O)       (math)     (pure fn)
```

| Layer | Location | Responsibility |
|---|---|---|
| **Skills** | `lib/model/skills/` | Pure functions — no network, no DB, no env vars |
| **Models** | `lib/model/` | Statistical logic; receives normalized data, returns typed output |
| **Agents** | `lib/agents/`, `lib/data/` | External APIs, env vars, ISR cache, runtime I/O |
| **UI** | `app/`, `components/` | Server Components by default; consumes ready data from agents |

The tournament Monte Carlo prediction is precomputed and stored in
`lib/data/tournament-prediction.json`. Live fixture data is fetched at runtime with
Vercel ISR (incremental static regeneration).

## Markets & Features

- 1X2 result
- Double chance
- Over/Under goals
- Both teams to score (BTTS)
- Exact score
- Clean sheet / win to nil
- Cards and corners
- Top scorers (Golden Boot)
- Group stage projection
- Champion and tournament path via Monte Carlo
- Implicit odds
- Player lineups and enriched squad data

## Commands

```bash
pnpm dev               # start local dev server
pnpm test              # run Vitest test suite
pnpm tsc --noEmit      # type-check without emitting
pnpm build             # production build
pnpm spec:check        # validate SDD spec index and structure
pnpm precompute        # regenerate tournament Monte Carlo prediction
pnpm refresh-fixtures  # refresh local fixture cache
```

## Learning goals

This repo is also a **learning and experimentation project**. Beyond building a real
World Cup predictor, it was used to explore and practice two engineering disciplines
end-to-end in a production context:

### Spec Driven Development (SDD)

Every feature and fix lives inside a spec before any code gets written. The idea is
simple: write down *what* and *why* before figuring out *how*. Each spec has three files:

```
specs/<name>/
  requirements.md   ← objective, scope, acceptance criteria, risks
  design.md         ← architecture decisions, data contracts, UX notes
  tasks.md          ← ordered implementation checklist
```

Gate statuses (`spec_review`, `grill`, `analyst`, `qa`, `code_quality`, `reviewer`) live
inside `requirements.md` frontmatter, so the spec itself is the source of truth for
what was reviewed and approved.

The discipline forces clarity before commitment: if you can't write a testable acceptance
criterion, the feature is not ready to build. It also creates a paper trail of *why*
decisions were made — useful weeks later when revisiting something.

### Layer harness

The codebase enforces a strict, unidirectional dependency graph:

```
UI  ←  Agents  ←  Models  ←  Skills
     (I/O)       (math)     (pure fn)
```

No layer may import from a layer above it. The goal was to make each layer independently
testable and to clearly separate concerns:

- **Skills** are pure functions — they have no knowledge of the network, the database,
  or environment variables. They can be tested with a single input and a known output.
- **Models** receive already-normalized data and return typed `ModelOutput` contracts.
  They never call APIs and never touch the DB.
- **Agents** are the only layer allowed to call external APIs, read env vars, use
  runtime cache, and perform I/O. They normalize the data before passing it down.
- **UI** (Server Components) consumes display-ready data from agents. Client Components
  do not import from `lib/model`, `lib/db`, or providers.

In practice this means a Poisson skill is just a math function you can test in isolation,
the prediction model never knows where its input came from, and the bracket page just
asks the agent layer for data and renders it.

The harness is enforced by convention and by the `reviewer` gate in every PR — not by
tooling — which made it a good way to internalize the discipline by *having to think
about it explicitly* on every change.

---

## Workflow

This repo uses SDD with trunk-based development:

1. Create a short branch from `main`: `phase/<number>-<description>` or `fix/<description>`.
2. Create or update a spec under `specs/<name>/` (see `specs/README.md`).
3. Implement in small PRs toward `main`.
4. Review the Vercel preview before merging.
5. Merge only with human approval.

The `specs/README.md` is the live roadmap index — every spec and its current status is
listed there.

### Agent orchestration flow

Claude Code orchestrates specialized subagents for each gate. The full flow from idea
to merged PR:

```
spec-init          create specs/<name>/{requirements,design,tasks}.md
     ↓
spec-review        verify the spec is ready before any code is written
     ↓
data-contract      define API/JSON/model shapes, nullability, fallbacks
     ↓
adr                document architectural decisions (when applicable)
     ↓
grill              stress-test the plan; surfaces blockers before coding starts
     ↓
[Analyst]          validates model math, lambdas, probabilities, market copy
[Design]           defines UX, visual direction, responsive behavior, copy
[Security]         audits secrets, CSP, API exposure, runtime boundaries
     ↓
task-runner + [Developer]   implements one scoped task per run
     ↓
[QA]               writes/runs Vitest tests, validates build and routes
[Code Quality]     reviews maintainability, typing, simplicity, duplication
[Reviewer]         audits harness compliance and spec-to-implementation consistency
[Design / Security re-check]   re-validates if UI or runtime was touched
     ↓
grill re-check     confirms blockers resolved (new models / APIs / markets)
     ↓
spec-closeout      verifies ACs, tasks, docs index, checks
     ↓
pr-prep            drafts the PR body from spec + diff + gate results
     ↓
commit             conventional commit, English, single line, no co-author
     ↓
PR → Vercel preview → human approval → merge to main
```

Skills order the *process*; agents validate *quality* from their specialty. They are
separate concerns: a skill never replaces a gate, and a gate never replaces a skill.

### `.claude/` directory

```
.claude/
├── agents/          specialized subagents, each with a defined scope and tool set
│   ├── analyst.md
│   ├── code-quality.md
│   ├── design.md
│   ├── developer.md
│   ├── qa.md
│   ├── reviewer.md
│   └── security.md
└── skills/          process skills that orchestrate or gate each phase of work
    ├── adr.md
    ├── commit.md
    ├── data-contract.md
    ├── grill.md
    ├── pr-prep.md
    ├── spec-closeout.md
    ├── spec-init.md
    ├── spec-review.md
    └── task-runner.md
```

#### Agents

| Agent | Role |
|---|---|
| `analyst` | Designs and validates statistical model logic: lambdas, probabilities, market contracts. |
| `developer` | Implements TypeScript/Next.js code strictly following harness contracts. |
| `design` | Defines and reviews visual direction, UX, responsive behavior, and copy. |
| `qa` | Writes and runs Vitest tests; validates build, routes, and model sanity checks. |
| `code-quality` | Reviews maintainability, typing, simplicity, and duplication. |
| `reviewer` | Audits harness compliance and spec-to-implementation consistency. |
| `security` | Reviews secrets, CSP, external API risks, and runtime boundaries. |

#### Skills

| Skill | When to use |
|---|---|
| `spec-init` | Create or normalize a spec folder and update `specs/README.md`. |
| `spec-review` | Verify a spec is ready before implementation starts. |
| `data-contract` | Define shapes, nullability, and fallbacks for APIs, JSON, models, and ISR. |
| `adr` | Document an architectural decision that has lasting impact. |
| `grill` | Pre-implementation stress-test; surfaces data, contract, and harness blockers. |
| `task-runner` | Execute one scoped task from an approved spec without scope drift. |
| `spec-closeout` | Close a spec: verify ACs, tasks, docs, checks before PR. |
| `pr-prep` | Draft the PR body from spec, diff, checks, and gate results. |
| `commit` | Create a conventional commit (English, single line, no co-author). |

## Deploy

Production runs on **Vercel ISR**. The `main` branch deploys to production automatically.
Every PR generates a Vercel preview deployment.

SQLite / better-sqlite3 is used only for local scripts and historical context; it does
not enter the Vercel runtime bundle.

Pre-merge checklist:

- `pnpm tsc --noEmit`
- `pnpm test`
- `pnpm build`
- `pnpm spec:check`
- Spec linked in PR
- `specs/README.md` updated if a spec changed state
- PR template complete
- Vercel preview reviewed for UI, route, or data changes

## Disclaimer

Entertainment and statistical analysis project. Not affiliated with FIFA. Does not
accept or process bets. Probabilities are model estimates, not guarantees.
