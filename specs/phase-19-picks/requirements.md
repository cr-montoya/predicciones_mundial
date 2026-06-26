---
status: in_review
phase: 19
owner: cristian
branch: phase/19-picks
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: passed
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-19-picks — Requirements

## Status

in_review

## Objective

Allow any visitor to the app to make result picks (1X2) before each match and see
whether they got it right once the match finishes. The focus is the personal experience
of "my judgment vs the AI" without needing an account or backend.

## Context

The app already shows AI predictions (result probabilities, top scorers, corners, etc.).
The natural next step is for the user to contrast their intuition against the projection:
choose the result before the match and see the verdict afterward.

The necessary data is already in the model: `Fixture.status` distinguishes `scheduled`,
`live`, and `finished`; `homeGoals`/`awayGoals` give the final result. No new backend is needed.

## Storage Decision

**localStorage** for the following reasons:

- Zero friction: no account, auth, or external service required.
- Aligned with the entertainment framing: the pick is personal to the device.
- The Vercel + ISR stack has no DB runtime; adding one just for picks is
  over-engineered for MVP.
- If multi-device persistence or a leaderboard is desired in the future, the picks
  contract is migratable without changing the UI or verification logic.

## Scope

- 1X2 button in each match view (`app/fixtures/[id]`) before kickoff.
- Pick saved in localStorage with key `pick_<fixtureId>`.
- Pick locked when `status === 'live' || status === 'finished'`.
- Verdict (✓ Correct / ✗ Wrong) visible when `status === 'finished'` and a pick is saved.
- Pick badge on fixture list cards (`app/fixtures`) to quickly identify which matches
  already have a pick.

## Out of Scope

- Picks for top scorers, exact score, or other markets (future phase).
- Persistence in a database or user account.
- Ranking or comparison between users.
- Push notifications of results.

## Data Model (localStorage)

```ts
// Key: `pick_${fixtureId}`  — string
type PickOutcome = 'home' | 'draw' | 'away'

interface StoredPick {
  fixtureId: number
  outcome: PickOutcome
  pickedAt: string  // ISO 8601
}
```

### Verdict Resolution

```ts
function resolveVerdict(
  pick: PickOutcome,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' {
  const actual: PickOutcome =
    homeGoals > awayGoals ? 'home' :
    awayGoals > homeGoals ? 'away' :
    'draw'
  return pick === actual ? 'correct' : 'incorrect'
}
```

This logic goes in `lib/skills/picks.ts` as a pure function.

## Requirements

1. In the fixture detail view, the user can choose home / draw / away
   before the match begins.
2. The pick is locked (not editable) as soon as the match goes to `live` or
   `finished`.
3. When the match finishes, a clear verdict is shown: correct or wrong.
4. The choice persists between reloads on the same device (localStorage).
5. In the fixture list, each card shows an indicator of whether a pick was made.
6. Login is not required to make a pick.

## Acceptance Criteria

- [ ] Scheduled match: 1X2 buttons active, pick is saved and persists on reload.
- [ ] Live match: buttons disabled, saved pick shown in locked state.
- [ ] Finished match + correct pick: ✓ verdict visible with final score.
- [ ] Finished match + incorrect pick: ✗ verdict visible with final score.
- [ ] Finished match without pick: picks section not shown.
- [ ] Fixture list: card with pick shows differentiating badge.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes (skill `resolveVerdict` covered by unit tests).

## Risks and Assumptions

- localStorage can be cleared by the user or browser. The design assumes this
  is acceptable in an entertainment context.
- The pick is based on the kickoff time from the server; if the user's device
  time is offset, the lock may not coincide exactly. Acceptable for MVP — the
  source of truth is `fixture.status` from the API, not the client clock.
- Picks are Client Components (they need access to localStorage), but the rest
  of the fixture page remains a Server Component. The picks block is
  isolated as a small client component that receives the fixture as a prop.
