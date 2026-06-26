# PLAN.md — World Cup 2026 Prediction Simulator

Implementation plan by phase. Goal: a Next.js app deployed on Vercel with ISR, fresh fixture data at runtime, statistical markets per match, and a UI ready for content without breaking the harness.

---

## General architecture

```
Request to Vercel
   -> ISR / revalidate every 1 hour
   -> live-loader fetches fixtures from football-data.org at server runtime
   -> Normalizes fixtures and computes lightweight markets with Poisson
   -> Reads precomputed Monte Carlo from lib/data/tournament-prediction.json
   -> Next.js UI renders home, fixtures, groups, and match detail
```

Current state: the app runs on **Vercel ISR**. It no longer uses `output: 'export'` or `out/`
as the production source. Fixtures are loaded at server runtime with `FOOTBALLDATA_KEY`, and
Vercel caches/regenerates pages with `revalidate = 3600`. The tournament stays precomputed
because Monte Carlo is more expensive and is updated with `pnpm precompute` when needed.

Three separate layers: ingestion (raw data), model (pure math, no network), presentation (UI).
The model never calls the API; it only consumes normalized fixtures/stats or precomputed JSON.
This keeps it testable, fast, and compatible with ISR.

---

## Data sources

1. **API-Football (RapidAPI)** — primary. Provides fixtures, live results, lineups, events
   (goals, cards, minute), per-match statistics (corners, shots, possession), and player stats.
   Free plan: 100 requests/day.
2. **football-data.org** — free, good for fixtures and results, serves as fallback.

---

## Markets projected by the model

- **Result 1X2**: home win / draw / away win.
- **Double chance**: 1X, 12, X2.
- **Over/Under goals**: lines 1.5, 2.5, 3.5.
- **BTTS** (both teams to score): yes / no.
- **Exact score**: top 5 most probable scorelines.
- **Top scorer**: first goal scorer and anytime scorer.
- **Total cards**: over/under 3.5, red card probability.
- **Corners**: over/under (dynamic line).
- **Clean sheet / win to nil**.
- **Tournament**: group stage qualifiers, champion projection, Golden Boot.

---

## The model (`lib/model/`)

- **Base**: Poisson distribution over expected goals (xG). Industry standard for projecting
  goals, BTTS, over/under, and exact score.
- **Lambda (expected goals)**: team attacking strength, opponent defensive strength, FIFA ranking,
  recent form (last 5–10 matches), home advantage.
- **Cards and corners**: regression over historical averages adjusted by match intensity.
- **Top scorers**: distributes team lambda among players by historical goals per minute.
- **Champion / Golden Boot**: Monte Carlo — simulate the tournament 10,000 times and count frequencies.

---

## Phases

### Phase 0 — Setup
- `create-next-app` with TS, Tailwind, App Router.
- shadcn/ui init, Recharts, better-sqlite3, vitest.
- Structure: `app/`, `lib/data/`, `lib/model/`, `lib/db/`, `scripts/refresh.ts`.
- DB in `data/mundial.db` (gitignored).
- `.env.example` with `RAPIDAPI_KEY`.

### Phase 1 — DB Ingestion
- SQLite schema: teams, players, fixtures, match_events, match_stats, predictions.
- API-Football client with retry and cache.
- Seed of the 12 groups and 48 teams for the 2026 World Cup.

### Phase 2 — Prediction Model
- `lib/model/poisson.ts`: expected goals → score probability matrix.
- Derive from that matrix: 1X2, over/under, BTTS, exact score.
- `lib/model/cards.ts`, `corners.ts`, `scorers.ts`, `montecarlo.ts`.
- Vitest tests to validate that numbers make sense.

### Phase 3 — On-Demand Refresh
- `scripts/refresh.ts`: fetches new results, updates form, recalculates predictions. Run with `pnpm refresh`.
- Refresh Server Action for a dashboard "Refresh" button, reusing the same logic as the script.
- Freshness guard: refresh does not call the API again if the last run was less than N minutes ago (protects the 100 req/day free quota).
- No node-cron or scheduler: control of when to refresh is manual.

### Phase 4 — Dashboard
- Home: champion projection (Monte Carlo) + Golden Boot.
- Group view: projected standings table.
- Match view: all markets in visual cards.
- Dark design, large typography, probability-based colors.

### Phase 5 — Polish
- Animations with framer-motion.
- Banner: "Statistical entertainment analysis. Not betting advice."
- Capture mode: clean view for clips.
- "Last updated" indicator (timestamp of last run) visible in the UI.

### Phase 6 — Broadcast Design
- **Visual style**: Sports data terminal look (broadcast / Opta). Large numbers as protagonist.
  Dark background with accent. Custom visualizations (not default Recharts).
- **Redesigned home**:
  - Today's matches (fixtures with status and kickoff time)
  - Top 10 recommended markets (highest-probability markets across all matches)
  - Champion candidates and Golden Boot (secondary, but present)
- **Palette**: Dark + one accent (gold, cyan, green). No generic purple gradients. No floating rounded cards.
- **Typography**: Monospace (already in Tailwind), numbers at 3xl/4xl, labels in caps with `tracking-widest`.

### Phase 7 — FIFA World Cup 2026 Branding
- **Logo and official colors**: Red (#c8102e) + Mexico Green (#009a44) + Canada Blue (#002868) + Navy background (#060d1a).
- **Improved header**: Red SVG trophy, horizontal three-color stripe (red-green-blue).
- **Hero badge**: "FIFA WORLD CUP" with red background, dark text.
- **Refined hero layout**: Match count more proportional, horizontally aligned with descriptive text.
- **Expandable candidates**: "SEE MORE →" button to expand full list (top 5 by default).

### Phase 8 — Historical Data for Team Calibration
- **Problem**: All teams had `attack_strength = defense_strength = 1.0`, causing uniform probabilities (~2% each).
- **Solution**: Precompute historical stats (last 4 years: 2022/2018 World Cups, Copa América, Euros, qualifiers).
- **Implementation**:
  - Create `lib/data/historical-stats.json` with `attack_strength` and `defense_strength` per team.
  - In `run-refresh.ts`, load stats from JSON and pass them to `recomputeStrengths()`.
  - Result: France, Spain, Argentina rise to 5–10% in tournament_winner; Haiti drops to <1%.

### Phase 9 — Cloudflare D1 Migration (historical)
- **Status**: Historical / replaced by Vercel ISR. Kept as context for past decisions, not current architecture.
- Explored Cloudflare Pages/D1/static export. Superseded by Vercel ISR in Phase 11.

### Phase 10 — Hardening & Authentication
- **Status**: Completed as a security/auth foundation. Review compatibility with Vercel on specific fixes when touching middleware, CSP, or env vars.
- Rate limiting by IP, simple JWT-based auth, and security headers (CSP, HSTS, X-Frame-Options, etc.).

### Phase 11 — Initial Deploy and Platform Migration
- **Status**: Completed. Production currently on Vercel ISR.
- `next.config.ts` without `output: 'export'`.
- `package.json` uses `pnpm build` → `next build`.
- Vercel handles PR previews and production from `main`.
- Server-side variables in Vercel: `FOOTBALLDATA_KEY` and any required fallback.

### Current architecture (post-Phase 14 + infrastructure fixes)

The app migrated to **Vercel ISR**:
- Fixtures: `lib/agents/live-loader.ts` calls `fetchFixtures()` at server runtime.
- Cache: pages with `export const revalidate = 3600`.
- Team strengths: `lib/data/historical-stats.json` + `computeStrengths` skill.
- Tournament: `lib/data/tournament-prediction.json` (Monte Carlo pre-generated with `pnpm precompute`).
- Vercel build: `pnpm build` → `next build`. No `out/` or `scripts/make-out.mjs`.
- CSP: adjusted for Next.js/Vercel and reviewed in subsequent fixes.

### Phase 12 — Enriched Historical Data
- **Status**: Completed.
- **Spec**: `specs/phase-12-enriched-historical-data/`
- Enriched `historical-stats.json` with more competitions (2022/2026 qualifiers, Nations League, Confederations Cup) and more years (2020–2026). Added competition weighting (tournament > qualifiers > friendlies).

### Phase 13 — Explicit Predictions in Fixture Cards
- **Status**: Completed.
- **Spec**: `specs/phase-13-fixture-prediction-cards/`
- Each home card now shows the predicted winner with probability ("España gana · 64%") and expected goals ("2.3 goles"). "SEE →" link to match detail.

### Phase 14 — Visual Design System
- **Status**: Completed (PR #1). Broadcast base with visual tokens, Outfit font, and gold accents.
- **Spec**: `specs/phase-14-visual-design-system/`
- Added `design` agent to `.claude/agents/design.md`. Visual tokens in `app/globals.css`. Refactored all main components to the broadcast/sports data terminal direction.

### Phase 15 — Spanish Glossary and Market Labels
- **Status**: Completed.
- **Spec**: `specs/phase-15-spanish-glossary/`
- Full UI in Spanish LATAM with neutral analysis tone. Added info buttons per market section. Created typed dictionary `lib/content/markets-es.ts`. Disclaimer banner prominent.

### Phase 16 — Top Scorer Markets and Extended Per-Match Markets
- **Status**: Completed (PR #7).
- **Spec**: `specs/phase-16-top-scorer-markets/`
- Added team total goals markets (home/away over 0.5/1.5/2.5), win to nil, and enriched scorer section. Static squad data for all 48 teams. Confidence displayed per market.

### Phase 17 — Implied Odds from Bookmakers
- **Status**: Completed.
- **Spec**: `specs/phase-17-implied-odds/`
- Integrated implied probabilities from The Odds API (free tier: 500 req/month). New agent `lib/agents/odds-loader.ts` normalizes odds to implied probabilities (1/odd with overround adjustment). Differential (model vs. market) shown per market with value label. Framing: reference information only, not a recommendation.

### Phase 18 — Player Lineups and Enriched Scorer Data
- **Status**: Completed.
- **Spec**: `specs/phase-18-player-lineups/`
- Incorporated confirmed lineups (~1h before kickoff) and injury/suspension data. `scorers.ts` receives lineup as optional input. Confidence: confirmed lineup → `medium`; no lineup → `low`. "LIMITED DATA" badge removed when lineup is confirmed.

### Phase 19 — Picks
- **Status**: Completed.
- **Spec**: `specs/phase-19-picks/`
- User can save match predictions (picks) from fixture cards. Picks stored in localStorage. Picks page (`/mis-picks`) shows saved selections.

### Phase 20 — Accuracy Tracking
- **Status**: Completed.
- **Spec**: `specs/phase-20-accuracy/`
- Model accuracy tracking against real results. Accuracy badge shown per market type.

### Phase 21 — Bracket View
- **Status**: Completed.
- **Spec**: `specs/phase-21-bracket/`
- Visual knockout bracket projection derived from Monte Carlo tournament simulation.

### Phase 22 — My Picks Page
- **Status**: Completed.
- **Spec**: `specs/phase-22-my-picks/`
- Dedicated page at `/mis-picks` with all saved user picks, match dates, and resolution state when results are available.

### Phase 23 — Share Card
- **Status**: Completed.
- **Spec**: `specs/phase-23-share-card/`
- Shareable image card for match predictions (OG card + capture mode for social content).

### Phase 24 — Team Page
- **Status**: Completed.
- **Spec**: `specs/phase-24-team-page/`
- Individual team page with group standing projection, squad, and market summary.

### Phase 25 — Match Context (H2H)
- **Status**: Completed.
- **Spec**: `specs/phase-25-match-context/`
- Head-to-head history panel in match detail: form strip, last meetings, stage labels.

### Phase 26 — Picks Reminder
- **Status**: Completed.
- **Spec**: `specs/phase-26-picks-reminder/`
- Banner and nav badge reminding users of upcoming matches without a saved pick. Client Component with localStorage dismiss.

### Phase 27 — Live Top Scorers
- **Status**: Completed.
- **Spec**: `specs/phase-27-live-top-scorers/`
- Live scorer data fetched from football-data.org at runtime. Goals column (green) in the Golden Boot table. Two-tier sort: real goals first, then model probability.

---

## Roadmap summary

- **Completed**: Phases 0–27.
- **Next product phases**: Phase 28 (EN/ES language toggle) and Phase 29 (portfolio rebrand completion).

## Spec index by phase

| Phase | Spec folder |
| --- | --- |
| 0 | `specs/phase-00-setup/` |
| 1 | `specs/phase-01-db-ingestion/` |
| 2 | `specs/phase-02-prediction-model/` |
| 3 | `specs/phase-03-on-demand-refresh/` |
| 4 | `specs/phase-04-dashboard/` |
| 5 | `specs/phase-05-polish/` |
| 6 | `specs/phase-06-broadcast-design/` |
| 7 | `specs/phase-07-branding-world-cup/` |
| 8 | `specs/phase-08-historical-data/` |
| 9 | `specs/phase-09-cloudflare-d1/` (historical) |
| 10 | `specs/phase-10-hardening-auth/` |
| 11 | `specs/phase-11-deploy-vercel-isr/` |
| 12 | `specs/phase-12-enriched-historical-data/` |
| 13 | `specs/phase-13-fixture-prediction-cards/` |
| 14 | `specs/phase-14-visual-design-system/` |
| 15 | `specs/phase-15-spanish-glossary/` |
| 16 | `specs/phase-16-top-scorer-markets/` |
| 17 | `specs/phase-17-implied-odds/` |
| 18 | `specs/phase-18-player-lineups/` |
| 19 | `specs/phase-19-picks/` |
| 20 | `specs/phase-20-accuracy/` |
| 21 | `specs/phase-21-bracket/` |
| 22 | `specs/phase-22-my-picks/` |
| 23 | `specs/phase-23-share-card/` |
| 24 | `specs/phase-24-team-page/` |
| 25 | `specs/phase-25-match-context/` |
| 26 | `specs/phase-26-picks-reminder/` |
| 27 | `specs/phase-27-live-top-scorers/` |
| 28 | `specs/phase-28-i18n/` |
| 29 | `specs/phase-29-portfolio-rebrand/` |

---

## Agents and verification flow

Each phase is validated with these agents in sequence. Those that do not apply are skipped,
except QA, Reviewer, and Security, which always close the cycle:

1. **Analyst** (if model or technical copy changes): validates math, contracts, lambdas, and market explanations.
2. **Design** (if UI or visual copy changes): defines visual direction, hierarchy, responsive behavior, empty states, and capture checklist.
3. **Developer** (if code changes): implements following the harness.
4. **QA** (always): runs tests, validates model output sanity checks, main routes, and build. Tests pass = ✅.
5. **Design** (if there was UI): reviews visual fidelity, readability, responsive behavior, and component consistency. No blockers = ✅.
6. **Reviewer** (always): audits harness, layers, and conventions. No blockers = ✅.
7. **Security** (always, critical before any deploy): detects vulnerabilities, secret exposure, OWASP. No CRITICAL = ✅.

**Model flow**: Analyst → Developer → QA → Reviewer → Security → Approved.

**Design/UI flow**: Design → Developer → QA → Design → Reviewer → Security → Approved.

**Mixed flow**: Analyst → Design → Developer → QA → Design → Reviewer → Security → Approved.

If any agent reports a blocker: return to Developer to fix, then re-validate from QA.
If the blocker changes the statistical contract, return to Analyst first.
If it changes the visual direction, return to Design first.

---

## Git and deploy flow

Since `main` is connected to production on Vercel, new phases are not worked on directly on `main`.
The flow is **trunk-based development with short branches**: `main` remains the stable trunk,
and each phase lives in a temporary branch that integrates quickly via PR.

### Branch rules
- `main` represents production and must always be deployable.
- Each phase is implemented on a branch from an up-to-date `main`.
- Suggested naming:
  - `phase/28-i18n`
  - `phase/29-portfolio-rebrand`
  - `fix/<short-description>` for small fixes.
- Branches should be small and short-lived: ideally one phase or one clear sub-deliverable.
- If a phase grows too large, split it into vertical PRs that do not break production.

### Flow per phase
1. Create a branch from `main`.
2. Run the applicable agent flow: Analyst/Design → Developer → QA → Design if UI was touched → Reviewer → Security.
3. Run local verification before the PR: `pnpm test` and `pnpm build` at minimum; `pnpm tsc --noEmit` if not covered by build.
4. Open PR toward `main` using `.github/pull_request_template.md`, with summary, scope, risks, screenshots if UI changed, and commands run.
5. Wait for the Vercel preview deployment to test the branch without touching production.
6. Review the PR and preview: functionality, design, copy, data, and mobile behavior if applicable.
7. Only after approval: merge to `main`.
8. Vercel deploys production from `main`; if something breaks, rollback from Vercel or revert the PR.

### Merge criteria
- PR approved by the owner.
- PR template complete, with non-applicable sections explicitly marked.
- Local/CI checks green.
- QA with no failures.
- Reviewer with no blockers.
- Security with no criticals.
- Design approved if there were visual or copy changes.
- Vercel preview reviewed when the phase touches UI, routes, build, ISR, or data.

### Recommendations to protect production
- Enable branch protection on GitHub for `main`: block direct pushes, require PR and green checks.
- Keep Vercel deploying production only from `main`.
- Use Vercel preview deployments for all branches/PRs.
- Avoid mixing large refactors with product changes in the same PR.
- Use simple feature flags for risky changes, or keep new routes/markets hidden until approved.
- For precomputed data, review the JSON diff when probabilities or key fixtures change.

---

## Risks

- **Free API limit**: since refresh is manual and has a freshness guard, you control each call and respect the 100 req/day limit. For live data during matches, a paid plan is needed.
- **Prediction quality**: Poisson is solid for goals, noisier for cards/corners. Show low confidence on those markets.
- **Legal**: as long as the app only shows probabilities and does not accept money, it is statistical analysis.
- **Vercel ISR**: any new phase must preserve `revalidate`, secure server runtime, and server-side variables without the `NEXT_PUBLIC_` prefix.
- **Cloudflare**: stays as DNS/CDN if used, but must not inject scripts that break CSP or Next.js.
- **D1/Workers**: remain a future option if Cloudflare runtime is revisited; not part of the current flow.
- **main tied to production**: no phase change may enter `main` directly; everything goes through a branch, PR, preview, and human approval before merge.
