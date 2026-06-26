---
status: completed
phase: 21
owner: cristian
branch: phase/21-bracket
pr:
preview:
gates:
  spec_review: pending
  grill: pending
  analyst: pending
  design: pending
  data_contract: pending
  security: not_applicable
  qa: pending
  code_quality: pending
  reviewer: pending
---

# phase-21-bracket — Requirements

## Status

pending

## Objective

Show the World Cup 2026 knockout bracket with the model's probabilities for each
possible matchup, updated as the tournament progresses. This is the most viral
tournament content: it lets users see "what path does the AI project toward the final".

## Context

The World Cup 2026 has 48 teams in 12 groups of 4. The group stage produces
32 qualifiers (top 2 from each group + 8 best third-place teams) who advance to the
Round of 32. Knockout fixtures are already available in football-data.org with
`round: 'round_of_32'`, `'round_of_16'`, `'quarter_final'`, `'semi_final'`,
`'final'`. The model already has round intensity constants in `lib/model/constants.ts`.

When matchups are not yet defined (because the group stage has not finished),
the bracket is shown with already-known qualifiers and empty slots for pending ones.

## Scope

- `/bracket` route with the full knockout bracket.
- Each matchup shows: teams (with flags), model probability of advancement for each,
  and actual result if the match has been played.
- Empty slots with "To be determined" while qualifiers are not confirmed.
- Link from home and from the nav.
- Server Component with ISR (revalidate 3600).

## Out of Scope

- Interactive simulator where the user predicts their own bracket (future phase).
- Cumulative probabilities of reaching the final or winning (already on home in `Candidates`).
- Timeline or history of how probabilities evolved.

## Requirements

1. The `/bracket` route is accessible and renders the knockout bracket.
2. Each matchup in a defined round shows both teams with their flag and the model's
   probability of advancement (`result_1x2` adjusted by `ROUND_INTENSITY`).
3. If the match has been played, shows the actual result and marks the winner.
4. If a qualifier is not yet confirmed, the slot shows "To be determined".
5. The layout is readable on mobile (one column per round, horizontal scroll or
   collapsed view).
6. Navigation link to `/bracket` in the global nav.

## Acceptance Criteria

- [ ] `/bracket` renders without errors with real tournament data.
- [ ] Played knockout matches show actual result.
- [ ] Pending matches show model probabilities.
- [ ] Slots without qualifier show "To be determined".
- [ ] Readable on mobile.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm build` passes.

## Risks and Assumptions

- football-data.org may not return knockout matchups until the group stage ends.
  The design must handle the case of empty knockout `fixtures` or empty slots without breaking.
- The bracket layout on mobile is a known UX challenge; the MVP solution is
  horizontal scroll or collapsing by round.
- The `round` strings from the API (`ROUND OF 32`, etc.) may need normalization
  to the internal format (`round_of_32`).
