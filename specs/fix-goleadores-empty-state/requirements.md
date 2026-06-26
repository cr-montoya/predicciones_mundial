---
status: completed
phase:
owner: cristian
branch: fix/goleadores-empty-state
pr: "10"
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: passed
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: not_applicable
  reviewer: passed
---

# fix-goleadores-empty-state — Requirements

## Status

completed

## Objective

Show real top scorer projections in the SCORERS section of each match,
feeding the model with static historical data for all 32 World Cup 2026 teams.

## Context

`computePredictionsForFixture` in `lib/agents/live-loader.ts` always passes
`homePlayers: []` and `awayPlayers: []`. The scorers model detects that there are no
eligible players and returns `probabilities: {}`, so the SCORERS section appears
empty (or is hidden by the defensive guard).

The correct solution is to provide real data to the model, following the same pattern
as `lib/data/tournament-prediction.json`: precomputed/static data that serves as the
source of truth until real lineup integration arrives (phase 18).

## Scope

- Create `lib/data/squads.ts` with the top scorers for each of the 32 teams,
  with their historical goals-per-minute rates (WC 2022 stats, 2026 qualifiers, and
  recent national team data).
- Update `computePredictionsForFixture` to inject `homePlayers` and `awayPlayers`
  from that static file.
- Keep the `scorerMarkets.length > 0` guard in the UI as a safety net for teams
  without data (e.g., if a new uncovered team is added).

## Out of Scope

- Integrating API-Football for real lineups (phase 18).
- Changing the mathematical scorers model.
- Adding new scorer markets.

## Requirements

1. `lib/data/squads.ts` contains data for all 32 World Cup 2026 teams.
2. Each team has at least 4 eligible players (`minutesPlayed >= 90`, `goalsPerMinute > 0`).
3. `computePredictionsForFixture` injects `homePlayers` and `awayPlayers` from `squads.ts`.
4. The SCORERS section shows players with real names and probabilities.
5. The "LIMITED DATA" badge is kept (the projection is historical, not a confirmed lineup).
6. The `scorerMarkets.length > 0` guard remains as a safety net.

## Acceptance Criteria

- [ ] SCORERS section shows players with names and probability bars.
- [ ] The "LIMITED DATA" badge still appears.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes.
- [ ] Vercel preview shows the section with data in any unfinished match.

## Risks and Assumptions

- Data is approximate (historical stats, not the day's lineup). The "LIMITED DATA" badge
  communicates this correctly.
- When phase 18 integrates real lineups, only the data source in
  `computePredictionsForFixture` is replaced — the model and UI do not change.
- If a team is not in `squads.ts`, the guard in page.tsx silently hides the section
  instead of showing a broken state.
