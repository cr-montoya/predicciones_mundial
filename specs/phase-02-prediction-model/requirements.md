# Requirements: Phase 2 - Prediction Model

## Status

Completed.

## Objective

Implement the base statistical model to project match and tournament markets.

## Requirements

1. A Poisson distribution for expected goals must exist.
2. An exact score matrix must exist.
3. Markets must be derived: 1X2, over/under, BTTS, and exact score.
4. Models for cards, corners, top scorers, and Monte Carlo must exist.
5. Models must be pure with respect to network/DB.
6. Probabilities must pass sanity checks.

## Success Criteria

1. Probabilities sum to 1.0 where applicable.
2. Tests for skills/models pass.
3. Strong inputs produce statistically coherent results.
