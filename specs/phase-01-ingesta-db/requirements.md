# Requirements: Phase 1 - Ingestion and DB

## Status

Completed.

## Objective

Create the data layer for fixtures, teams, events, statistics, and predictions.

## Requirements

1. A schema must exist for teams, fixtures, events, stats, and predictions.
2. An API-Football provider with retry/cache must exist.
3. A football-data.org fallback must exist.
4. A seed of World Cup 2026 national teams must exist.
5. Providers must normalize external responses to internal types.
6. The UI must not consume raw responses from external APIs.

## Success Criteria

1. Local scripts can populate base data.
2. Providers return normalized fixtures.
3. Normalization tests pass.
