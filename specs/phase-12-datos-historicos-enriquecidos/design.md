# Design: Phase 12 - Enriched Historical Data

## Flow

```
expanded historical sources
   -> historical-stats.json
   -> computeStrengths
   -> tournament-prediction.json
```

## Decisions

- Keep JSON versioned.
- Change formulas only if Analyst approves the contract.
- Validate outputs with a statistical sanity check.

## Risks

- Bias from competitions with unequal level.
- Old data with excessive weight.
- Probability changes without explanation.
