# phase-21-bracket — Design

## Route

`app/bracket/page.tsx` — Server Component, `revalidate = 3600`.

## Architecture

```
app/bracket/page.tsx  (Server Component)
  ↓ loadFixtures() → filters by round !== 'group'
  ↓ buildStaticTeams() → teamMap
  ↓ computePredictionsForFixture() → result_1x2 per matchup
  → <BracketView rounds={...} />  (Server Component)
      → <BracketRound> → <BracketMatchup>
```

## Round Structure (WC 2026)

```
Round of 32 (16 matches)
  → Round of 16 (8 matches)
    → Quarter Finals (4 matches)
      → Semi Finals (2 matches)
        → Final (1 match)
        → 3rd Place (1 match)
```

## New Files

| File | Description |
|---|---|
| `app/bracket/page.tsx` | Main Server Component |
| `components/bracket-view.tsx` | Visual layout of the full bracket |
| `components/bracket-matchup.tsx` | Individual matchup: teams + probs + result |

## Visual Design of `BracketMatchup`

```
┌──────────────────────────────┐
│  🇦🇷 Argentina       65%  →  │
│  ─────────────────────────── │
│  🇩🇪 Germany         35%     │
└──────────────────────────────┘
```

- Played match: show actual score, winner in gold accent.
- Pending match: show model probabilities with bar.
- Empty slot: `To be determined` in muted color.

## Mobile Layout

Horizontal scroll with one column per round. On desktop: column grid with
simple SVG connector lines between matchups.

## Nav

Add "BRACKET" link in `app/layout.tsx` alongside GROUPS and FIXTURES.

## Security and Runtime

- Server Component with ISR `revalidate = 3600`. No secrets exposed to the client.
- `FOOTBALLDATA_KEY` only in the agent (`live-loader`), never in UI.
- Knockout fixtures may be empty; handle empty array without errors.

## Testing Strategy

- No new mathematical logic — the existing model is already tested.
- Manual test: verify empty slots do not break the render.
- Manual test: verify played matches show score; pending ones show probabilities.
- `pnpm build` is the main gate (verifies the Server Component compiles).
