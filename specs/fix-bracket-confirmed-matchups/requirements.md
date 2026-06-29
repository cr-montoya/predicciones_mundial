---
status: in_review
phase:
owner: cristian
branch: fix/bracket-confirmed-matchups
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: not_applicable
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Fix Bracket Confirmed Matchups — Requirements

## Status

in_review

## Objective

The knockout bracket shows projected matchups computed from group standings even when
the API already returns the real knockout fixtures with confirmed teams. Concrete example:
the app showed Colombia vs Ecuador while the tournament had already confirmed Colombia vs
Ghana. This fix prioritises confirmed API data over computed projections.

## Context

The 2026 World Cup group stage ended on June 26, 2026. The football-data.org API now
returns all 16 Round of 32 fixtures with confirmed teams (homeTeamId and awayTeamId
non-null). However:

1. **Code bug** (`app/bracket/page.tsx` lines 54–66): A `confirmedTeams` map was built
   from the API's knockout fixtures but **never used**. `resolveSlot` always recomputed
   from group standings, ignoring the real teams.
2. **Stale cache** (`lib/data/fixtures-cache.json`): Generated on June 14 with only 72
   fixtures (partial group stage). Did not contain full group results or knockout fixtures.

## Scope

- Update `app/bracket/page.tsx` to use confirmed API teams when the knockout fixture
  already has non-null homeTeamId and awayTeamId.
- Update `lib/data/fixtures-cache.json` by running `pnpm refresh-fixtures` to include
  all group results and the 16 confirmed Round of 32 fixtures.
- Preserve the fallback logic (resolveSlot from standings) for when the API does not
  yet have a confirmed team.

## Out of Scope

- Changes to the statistical model or probabilities.
- Visual changes to the bracket component.
- Rounds beyond the Round of 32 (Round of 16, quarters, semis, final): those are not
  yet confirmed.
- Redesigning the fixture caching architecture.

## Requirements

1. When the API returns a knockout fixture with non-null homeTeamId and awayTeamId,
   the bracket must display those real teams, not standings projections.
2. When the API returns a knockout fixture with null homeTeamId or awayTeamId (TBD),
   the bracket must fall back to the projection computed from standings.
3. The `resolveSlot` function must be preserved and continue to be used as a fallback.
4. The mapping between ROUND_OF_32_DEFS matchIds (M73–M88) and real API fixture IDs
   must be correct and explicit.
5. `fixtures-cache.json` must reflect all group stage results and the 16 confirmed
   knockout fixtures.
6. The production build must not break (`pnpm build`).
7. No TypeScript errors (`pnpm tsc --noEmit`).

## Acceptance Criteria

- [ ] The bracket shows Colombia vs Ghana (not Colombia vs Ecuador) for match M83.
- [ ] All other Round of 32 fixtures show the real API teams when confirmed.
- [ ] For any knockout fixture where the API does not have a confirmed team, the bracket
      still shows the standings projection (label "TBD").
- [ ] `pnpm tsc --noEmit` passes without errors.
- [ ] `pnpm build` passes.
- [ ] `pnpm test` passes.
- [ ] Vercel preview shows the correct bracket.

## Risks and Assumptions

- **Assumption**: The football-data.org API already exposes all 16 Round of 32 fixtures
  with confirmed teams. If not, the code fix is irrelevant until the API publishes them.
- **Risk**: The mapping between bracket matchIds (M73–M88) and real API fixture IDs may
  not exist explicitly; it must be resolved by teams (homeTeamId / awayTeamId) or
  by round/order.
- **Risk**: The fixture cache may not yet contain knockout fixtures if `refresh-fixtures`
  fails or the API delays publishing them.
- **Assumption**: `computeGroupStandings` logic is correct; the errors are only from stale
  data or from not prioritising confirmed fixtures.
