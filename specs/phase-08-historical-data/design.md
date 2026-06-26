# Design: Phase 8 - Historical Data

## Data

`historical-stats.json` contains normalized attack/defense values.

## Flow

```
historical-stats.json
   -> strength batch / computeStrengths
   -> calibrated teams
   -> match model / Monte Carlo
```

## Decisions

- Keep historical data as versioned JSON.
- Avoid network calls during model execution.
- Adjust strengths before simulating the tournament.

## Risks

- Incomplete or biased data.
- Overweighting short tournaments.
- Abrupt probability changes without tests.
