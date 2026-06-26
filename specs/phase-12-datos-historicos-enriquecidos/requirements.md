# Requirements: Phase 12 - Enriched Historical Data

## Status

Completed.

## Objective

Enrich `historical-stats.json` to better differentiate teams of similar strength.

## Requirements

1. Add additional competitions and years.
2. Evaluate weighting by competition type.
3. Maintain the `computeStrengths` contract.
4. Validate that favorites improve probability.
5. Avoid weaker teams being overweighted.

## Success Criteria

1. France/Spain/Argentina rise relative to the baseline.
2. Haiti stays below 1%.
3. Statistical tests pass.
