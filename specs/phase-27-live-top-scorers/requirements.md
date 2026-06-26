---
status: completed
phase: 27
owner: cristian
branch: phase/27-live-top-scorers
pr: "20"
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: passed
  design: passed
  data_contract: passed
  security: passed
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Live Top Scorers — Requirements

## Status

completed

## Objective

Show the current real goals in the tournament in the "Golden Boot Candidates" section
alongside the probability predicted by the model, and keep the candidate list
synchronized with the actual World Cup 2026 top scorers. Today the precomputed JSON
is never updated at runtime, so players with real goals (e.g., Messi with 5 goals)
do not appear or appear with outdated data.

## Scope

- Runtime (ISR) fetch of current World Cup 2026 top scorers from
  `football-data.org /v4/competitions/WC/scorers`.
- Show current real goals alongside the model's % probability for each
  visible candidate.
- Combine candidates from the precomputed JSON (by probability) with real tournament
  leaders (by goals), prioritizing players with real goals when there is a conflict.
- Update `squads.json` and re-run the Monte Carlo (`pnpm precompute`) as part of the
  deployment or a documented manual process to reflect real goals in the probabilities.
- Fallback: if the scorers fetch fails, show candidates from the precomputed JSON without
  the goals column.

## Out of Scope

- Automatic cron job in Vercel to trigger `pnpm precompute` (may be a future phase).
- Showing assists or additional statistics.
- Re-running the Monte Carlo at request time (too costly for ISR).
- Changing the mathematical model for goal distribution.

## Requirements

1. The `live-loader` agent (or a new `scorers-loader` agent) must fetch the real
   tournament top scorers at runtime with a 3600s ISR cache.
2. The fetch must use `FOOTBALLDATA_KEY` server-side; never expose the key to the client.
3. The response must be normalized into a `LiveScorer` type with fields:
   `playerId`, `playerName`, `teamId`, `goals`, `assists`.
4. The visible candidate list must merge:
   a. Candidates from the precomputed JSON (sorted by probability).
   b. Real tournament top scorers sorted by current goals.
   The merge prioritizes showing real leaders even if their predicted probability
   in the JSON is low or null.
5. Each candidate row must show the current real goal count (or `—` if no goals
   registered) and the model probability.
6. If the endpoint fails or returns an empty list, the UI shows the precomputed JSON
   candidate list without the goals column (degradation without visible error).
7. The precompute script must be documented as a periodic step during the tournament to
   keep probabilities synchronized with real goals.
8. `pnpm tsc --noEmit`, `pnpm test`, and `pnpm build` must pass without errors.

## Acceptance Criteria

- [ ] The Golden Boot Candidates section shows current real goals for each player.
- [ ] Players with real goals (e.g., Messi) appear even if they are not in the top
      precomputed probabilities.
- [ ] The goals column shows `—` for candidates with no goals registered in the tournament.
- [ ] If `football-data.org` fails, the section still shows candidates (without goals).
- [ ] The API key is not visible in the client bundle.
- [ ] TypeScript compiles without errors.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] Vercel preview reviewed and section visible correctly.

## Risks and Assumptions

- `football-data.org /v4/competitions/WC/scorers` may be available with the free/basic
  tier; verify request limits and active plan.
- The tournament may be in the group stage, round of 16, quarters, etc.; the endpoint must
  return accumulated scorers for the entire tournament, not just the last phase.
- Name normalization between the API and `squads.json` may have inconsistencies
  (accents, compound surnames); use the same algorithm already used by `mergeWCScorers()`.
- If the precomputed JSON is very outdated, the probabilities may not reflect current
  reality; document when the last precompute ran in the UI (the `computedAt` field from
  the JSON).
- The candidate with the most real goals may not be among the top by probability; the
  merge must be explicit to avoid confusing lists.
