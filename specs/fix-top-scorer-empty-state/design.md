# fix-goleadores-empty-state — Design

## Context

`computePredictionsForFixture` in `lib/agents/live-loader.ts` calls `computeMatchOutputs`
with `homePlayers: []` and `awayPlayers: []`. The scorers model detects that there are no
eligible players and returns `emptyOutput` with `probabilities: {}`. The fixture page always
includes the scorer markets in `scorerMarkets`, so the SCORERS section always renders,
even when empty.

## Architecture

- **UI** (`app/fixtures/[id]/page.tsx`): filter `scorerMarkets` before rendering.
- No other layer is touched.

## Fix

In `app/fixtures/[id]/page.tsx`, after extracting `scorerMarkets`, filter those with
at least one outcome:

```ts
const scorerMarkets = pickMarkets(predictions, ['anytime_scorer', 'first_scorer'])
  .filter(m => Object.keys(m.probabilities).length > 0)
```

If the resulting array is empty, `MarketSection` already returns `null` by its own logic
(`if (markets.length === 0) return null`). The `CollapsibleSection` also does not render
because it is conditioned on `scorerMarkets.length > 0` (implicit in the current flow).

Verify that the SCORERS `CollapsibleSection` is conditioned:

```tsx
{scorerMarkets.length > 0 && (
  <FadeIn delay={0.25}>
    <CollapsibleSection title="SCORERS" ...>
      ...
    </CollapsibleSection>
  </FadeIn>
)}
```

If not conditioned, add the guard.

## UX

- Without data: the SCORERS section simply does not appear. No empty state or placeholder.
- With data: current behavior, including the "LIMITED DATA" badge when `confidence === 'low'`.

## Testing Strategy

- `pnpm tsc --noEmit`
- `pnpm test` — existing tests must not be affected
- Verify in Vercel preview that the section disappears for matches without a lineup
