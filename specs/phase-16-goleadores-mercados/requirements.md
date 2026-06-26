# Requirements: Phase 16 — Top Scorers and Extended Markets

## Problem

The match detail page still offers few markets for content. There are good base predictions
for result and goals, but the experience needs to be enriched with top scorers and derived
markets that make each match more useful and attractive.

## Objective

Add top scorer predictions and more derived markets per match, maintaining Vercel ISR,
the layer harness, and server-side API key security.

## Functional Requirements

1. The detail page must show more markets per match.
2. Team goals markets must exist:
   - Home over 0.5 / 1.5 / 2.5 goals.
   - Away over 0.5 / 1.5 / 2.5 goals.
3. Simple combo markets must exist:
   - Result + both teams score.
   - Result + over 1.5 / 2.5 goals.
   - Win to nil.
4. A first version of the top scorer market must exist:
   - Anytime scorer.
   - First scorer if sufficient data is available.
5. If there is no reliable player data, the UI must show market unavailable or
   low confidence, not invent precision.
6. All new outputs must have `confidence`, `modelVersion`, and `computedAt`.

## Non-Functional Requirements

1. Models and skills do not call external APIs.
2. Agents/providers are the only ones responsible for fetching external data.
3. Client components do not import models or providers.
4. The API key must not reach the browser.
5. Calculations must be cheap for ISR runtime.
6. Tournament Monte Carlo remains precomputed.

## Success Criteria

1. New markets appear in fixture detail without breaking the home.
2. Fixture detail renders with and without player data.
3. Derived probabilities stay between 0 and 1.
4. Tests cover new markets and edge cases.
5. `pnpm test` and `pnpm build` pass.
6. Vercel preview approved by owner before merge.
