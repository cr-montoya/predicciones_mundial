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

## Workflow

This repo uses **Spec Driven Development** with trunk-based development:

1. Create a short branch from `main`: `phase/<number>-<description>` or `fix/<description>`.
2. Create or update a spec under `specs/<name>/` (see `specs/README.md`).
3. Implement in small PRs toward `main`.
4. Review the Vercel preview before merging.
5. Merge only with human approval.

Each spec contains:

```
specs/<name>/
  requirements.md
  design.md
  tasks.md
```

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
