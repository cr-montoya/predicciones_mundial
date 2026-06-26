# phase-20-accuracy — Design

## Layer Architecture

```
UI (Server Components)
  ↓ reads: Fixture[] + computePredictionsRetroactive()
  ↓ calls: resolveModelVerdict, computeAccuracyStats (pure skills)
  ↓ renders: ModelResultCard, AccuracyWidget
```

No new agents. Everything is resolved in server components with pure skills and
the retroactive model function.

## New Files

| File | Layer | Description |
|---|---|---|
| `lib/skills/accuracy.ts` | Skill | `deriveActualOutcome`, `topModelCall`, `resolveModelVerdict`, `computeAccuracyStats`. Pure functions. |
| `components/model-result-card.tsx` | UI | Server Component. Shows retroactive prediction + verdict on finished fixture. |
| `components/accuracy-widget.tsx` | UI | Server Component. Global accuracy widget on the home. |

## Modified Files

| File | Change |
|---|---|
| `lib/agents/live-loader.ts` | Extract `computePredictionsRetroactive(fixture, byId)` without the `finished` guard. |
| `app/fixtures/[id]/page.tsx` | If `finished`, use `computePredictionsRetroactive` and render `<ModelResultCard>`. |
| `app/page.tsx` | Calculate `AccuracyStats` and render `<AccuracyWidget>` if `total >= 3`. |

## Change in `live-loader.ts`

```ts
// Existing function: only for non-finished matches (unchanged)
export function computePredictionsForFixture(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  if (fixture.status === 'finished') return []
  // ... same logic
}

// New function: without status guard
export function computePredictionsRetroactive(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  // same logic as computePredictionsForFixture but without the finished guard
}
```

The existing function does not change to avoid affecting live loading. The new one is
only called from `app/fixtures/[id]/page.tsx` when `fixture.status === 'finished'`.

## Visual Design of `ModelResultCard`

```
┌────────────────────────────────────────────────────┐
│  AI PREDICTION  ·  ✓ CORRECT                      │
│                                                    │
│  Home    ██████████░░░░░░  62%   ← top-1           │
│  Draw    ████░░░░░░░░░░░░  24%                     │
│  Away    ██░░░░░░░░░░░░░░  14%                     │
│                                                    │
│  Actual result: 2 - 1  (Home won)                 │
└────────────────────────────────────────────────────┘
```

- Top-1 bar in gold accent `#FFDB00`.
- Other bars in `rgba(255,255,255,0.15)`.
- Verdict ✓ in green `#22c55e` / ✗ in red `#ef4444`.
- If verdict is `✗`, show which outcome was correct.

## Visual Design of `AccuracyWidget` (home)

```
┌────────────────────────────────────────────────────┐
│  MODEL ACCURACY                                    │
│                                                    │
│  14 / 20 matches                   70%            │
│  ████████████████░░░░░░░░          ↑ bar          │
│                                                    │
│  1X2 Result · Finished matches only               │
└────────────────────────────────────────────────────┘
```

- Progress bar in `#FFDB00` over background `rgba(255,255,255,0.05)`.
- The percentage is displayed as a large number on the right (same visual hierarchy the
  home uses for probabilities).
- If total < 3: do not render the widget.

## Position on the Home

`<AccuracyWidget>` goes below `<Candidates>` (tournament projections) and before
any fixtures section, closing the global analysis section.

## Minimum Tests in Vitest

```ts
describe('accuracy skills', () => {
  it('deriveActualOutcome: home win', () => expect(deriveActualOutcome(2, 0)).toBe('home'))
  it('deriveActualOutcome: draw', () => expect(deriveActualOutcome(1, 1)).toBe('draw'))
  it('deriveActualOutcome: away win', () => expect(deriveActualOutcome(0, 1)).toBe('away'))
  it('resolveModelVerdict: correct when top-1 matches actual', () => {
    const probs = { home: 0.6, draw: 0.25, away: 0.15 }
    expect(resolveModelVerdict(probs, 2, 0)).toBe('correct')
  })
  it('resolveModelVerdict: incorrect when top-1 does not match actual', () => {
    const probs = { home: 0.6, draw: 0.25, away: 0.15 }
    expect(resolveModelVerdict(probs, 0, 1)).toBe('incorrect')
  })
})
```
