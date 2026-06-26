---
status: completed
phase: 20
owner: cristian
branch: phase/20-accuracy
pr:
preview:
gates:
  spec_review: approved
  grill: approved
  analyst: approved
  design: approved
  data_contract: approved
  security: not_applicable
  qa: approved
  code_quality: approved
  reviewer: approved
---

# phase-20-accuracy — Requirements

## Status

pending

## Objective

Show the model's predictions retroactively on finished matches and calculate a global
model accuracy percentage, so the app can answer: "How well does the AI predict the
World Cup?".

## Context

Currently `computePredictionsForFixture` has a guard `if (fixture.status ===
'finished') return []`, so finished matches only show "No predictions for this match".
The model is deterministic and only uses static data (team strengths, goal history).
It can run at any time — before or after the match — and produce the same probabilities.

That means for any finished match we can:

1. Run the model retroactively to get the pre-match probabilities.
2. Compare the model's top-1 prediction (`result_1x2`) with the actual result
   (`homeGoals` vs `awayGoals`).
3. Aggregate the verdicts of all finished matches to get a global accuracy percentage.

## Scope

### 1. Retroactive Predictions on Finished Matches

In `app/fixtures/[id]/page.tsx`, when `fixture.status === 'finished'`:

- Calculate retroactive predictions (new function without the guard).
- Show the final score (already exists).
- Show the model probabilities for `result_1x2` as they would have been
  projected before the match.
- Show the model verdict: whether the top-1 prediction matched the actual result
  or not.

### 2. Global Accuracy Widget on Home

In `app/page.tsx`, add a widget with:

- Finished matches analyzed.
- How many the model got right (top-1 of `result_1x2` == actual result).
- Accuracy percentage.
- Visual progress bar.

## Out of Scope

- Accuracy for other markets (goals, corners, cards). Only `result_1x2` in this phase.
- Historical tracking by date or group (future phase).
- Probabilistic score (Brier score, log-loss). Only binary top-1 accuracy for MVP.
- User picks (spec phase-19, independent).

## Data Model

### Skill: `resolveModelCall`

```ts
export type MatchOutcome = 'home' | 'draw' | 'away'

/** Determines the actual outcome from the final score. */
export function deriveActualOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/**
 * Given the model's result_1x2 distribution, returns the top-1 outcome
 * (the model's "call").
 */
export function topModelCall(probabilities: Record<string, number>): MatchOutcome | null {
  const sorted = Object.entries(probabilities).sort(([, a], [, b]) => b - a)
  const top = sorted[0]?.[0]
  if (top === 'home' || top === 'draw' || top === 'away') return top
  return null
}

/** Model verdict: correct or not. */
export function resolveModelVerdict(
  probabilities: Record<string, number>,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' | null {
  const call = topModelCall(probabilities)
  if (!call) return null
  return call === deriveActualOutcome(homeGoals, awayGoals) ? 'correct' : 'incorrect'
}
```

### Skill: `computeAccuracyStats`

```ts
export interface MatchAccuracyRecord {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  modelCall: MatchOutcome
  actual: MatchOutcome
  correct: boolean
  homeProb: number
  drawProb: number
  awayProb: number
}

export interface AccuracyStats {
  total: number
  correct: number
  pct: number  // 0-100
  records: MatchAccuracyRecord[]
}
```

This skill receives a list of already processed records (fixture + prediction) and
calculates totals. It is pure — no network, no storage.

## Requirements

1. The finished fixture page shows the model's pre-match probabilities for
   `result_1x2` (home / draw / away).
2. The finished fixture page shows the model verdict (correct / wrong)
   alongside the final score.
3. The home widget shows: matches analyzed, correct predictions, and percentage.
4. The skills `resolveModelVerdict` and `computeAccuracyStats` are pure functions
   with test coverage.
5. The rest of the finished fixture page (score, date, teams) does not change.
6. The guard `if (fixture.status === 'finished') return []` is moved or an alternative
   function is created; `finished` as a concept is not eliminated.

## Acceptance Criteria

- [ ] Finished fixture: shows retroactive `result_1x2` probabilities.
- [ ] Finished fixture: model verdict visible (✓ correct / ✗ wrong) with the
      actual result as reference.
- [ ] Home: global accuracy widget with total, correct predictions, and percentage.
- [ ] `pnpm tsc --noEmit` passes.
- [ ] `pnpm test` passes (skills covered: `deriveActualOutcome`, `topModelCall`,
      `resolveModelVerdict`).

## Risks and Assumptions

- The model is deterministic from static data, so recomputing for finished matches
  produces the same probabilities it would have produced before the match. If future
  phases incorporate real-time data (lineups, injuries), this property would no longer
  hold and pre-match predictions would need to be stored before the match begins.
- The accuracy percentage at the start of the tournament (first matches) may be
  statistically unrepresentative. The widget is only shown if there are at least
  3 finished matches.
- The accuracy computation in the home is done in the server component synchronously
  (no new network call, just iterating already loaded fixtures and applying the model).
  If the number of matches makes this too costly, it can be moved to a precomputed JSON.
