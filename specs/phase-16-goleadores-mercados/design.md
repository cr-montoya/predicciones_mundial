# Design: Phase 16 — Top Scorers and Extended Markets

## Approach

Derive as many markets as possible from the existing score matrix. This avoids
adding unnecessary complexity and keeps the model cheap for Vercel ISR.

Top scorer markets are more uncertain. They must have a separate contract and degrade
gracefully when player data, minutes, or starters are missing.

## Proposed Architecture

```
lib/model/skills/derive-markets.ts
   -> derived markets from score matrix

lib/model/scorers.ts
   -> top scorers from team lambda + player rates

lib/agents/live-loader.ts
   -> runtime fixtures + cheap predictions

app/fixtures/[id]/page.tsx
   -> enriched detail

components/market-section.tsx
components/player-scorers.tsx
   -> market and top scorer UI
```

## Markets Derived from Score Matrix

The exact score matrix allows deriving without extra data:

- 1X2.
- Over/Under goals.
- BTTS.
- Team totals.
- Result + BTTS.
- Result + Over.
- Clean sheet.
- Win to nil.
- Simple win margin.

These derivations must live in pure skills.

## Team Totals

For each team:

```ts
P(homeGoals > line)
P(awayGoals > line)
```

Initial lines:

- 0.5
- 1.5
- 2.5

## Combos

Examples:

- `home_win_btts_yes`
- `draw_over_1_5`
- `away_win_over_2_5`
- `home_win_to_nil`
- `away_win_to_nil`

Avoid too many visible combos. The UI should prioritize top markets by score/confidence.

## Top Scorers

Suggested minimum input:

```ts
interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  expectedMinutes: number
  goalsPer90: number
  penaltyShare?: number
  starterProbability?: number
}
```

Model:

1. Calculate the player's expected offensive participation.
2. Assign a portion of the team lambda.
3. Convert to scoring probability with Poisson:

```txt
P(score anytime) = 1 - exp(-playerLambda)
```

First scorer should be optional and only shown if there is sufficient data.

## Player Data

Preferred source:

- API-Football player stats.
- Recent lineups/minutes if available.

Fallback:

- Manual/precomputed dataset per player.
- If no data: do not show top scorers or mark low confidence.

Do not block the match detail because of missing players.

## UI

Suggested fixture detail order:

1. Match hero.
2. Main market: result / dominant probability.
3. Expected goals and team totals.
4. Top combos.
5. Cards/corners.
6. Top scorers, if data available.
7. Disclaimer and timestamp.

Keep 3–5 main markets visible and the rest in expandable sections.

## Performance

Derived markets from the matrix are cheap. Top scorers may be more expensive if there
are many players; limit to top N per team.

Initial recommendation:

- Top 5 top scorers per team.
- Do not calculate first scorer if starters/minutes are missing.

## Risks

### False Precision in Top Scorers

Without lineup data, the market may appear more reliable than it is.

Mitigation: low confidence and clear copy.

### Too Many Markets

The page may become saturated.

Mitigation: visual ranking, collapsible sections, and top markets.

### API Rate Limit

Fetching player stats per match may increase calls.

Mitigation: ISR cache, precomputed fallback, and do not block render.
