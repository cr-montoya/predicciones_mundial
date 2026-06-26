# Requirements: Phase 3 - On-Demand Refresh

## Status

Historically completed. Part of the flow was later replaced by Vercel ISR for fixtures.

## Objective

Allow updating data and predictions manually without a 24/7 process.

## Requirements

1. A `pnpm refresh` script must exist.
2. The refresh must fetch new fixtures/results.
3. The refresh must recalculate predictions.
4. A freshness guard must exist to protect the API quota.
5. No mandatory scheduler must exist.

## Success Criteria

1. The refresh runs locally.
2. The API quota is protected.
3. Reusable logic lives in agents/scripts, not in the UI.
