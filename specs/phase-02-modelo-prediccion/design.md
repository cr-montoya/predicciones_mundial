# Design: Phase 2 - Prediction Model

## Layers

```
pure skills
   -> score matrix / poisson / confidence
models
   -> outputs per market
agents
   -> provide normalized fixtures/teams/stats
```

## Components

- `lib/model/skills/poisson.ts`
- `lib/model/skills/score-matrix.ts`
- `lib/model/skills/derive-markets.ts`
- `lib/model/match-model.ts`
- `lib/model/montecarlo.ts`
- `lib/model/sanity.ts`

## Contract

Each relevant output must include market, probabilities, confidence, version, and timestamp.

## Risks

- Degenerate probabilities.
- Lambdas out of range.
- Mixing I/O with math.
