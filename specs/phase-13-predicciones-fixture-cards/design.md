# Design: Phase 13 - Predictions in Fixture Cards

## Data

`FixtureWithTeams` includes a `prediction` field with:

- `winner`.
- `winnerProb`.
- `expectedGoals`.

## UI

The card shows teams, time/status, and a compact prediction line.

## Risks

- Overloading the card.
- Showing predictions for finished matches.
- Recalculating too much on render.
