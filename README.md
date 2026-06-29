# World Cup 2026 Prediction Simulator

> AI-assisted statistical football analytics app

Statistical projection engine for the 2026 FIFA World Cup. The app runs a custom
**Poisson + Monte Carlo** model to compute match outcome probabilities, market
projections, and tournament predictions — framed as: *"this is how the AI predicts
the World Cup"*.

It is an entertainment and analysis experience: it shows probabilities, context, and
explanations. It does not accept or process bets, and it makes no financial promises.

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
