# Design: Phase 18 - Enriched Player Data

## Approach

Keep the top scorer model as a pure function that receives already normalized player data.
Agents handle fetching lineups/injuries and converting them to inputs.

## Proposed Architecture

```
API-Football lineups/injuries
   -> lib/agents/lineups-loader.ts
   -> normalization per fixtureId
   -> JSON/server cache
   -> lib/model/scorers.ts
   -> top scorers UI
```

## Lineups Agent

`lib/agents/lineups-loader.ts`:

- Receives `fixtureId` and kickoff.
- Only queries if the match is less than 2 hours away or has already started.
- Returns `null` if no lineup exists.
- Returns starters/substitutes if a lineup exists.
- Attaches source timestamp.

## Injuries

If the injuries endpoint is available:

- `out`: `starterProbability = 0`.
- `doubtful`: `starterProbability = 0.2`.
- `suspended`: `starterProbability = 0`.

Analyst may adjust values.

## Updated Scorer Contract

```ts
interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  expectedMinutes: number
  goalsPer90: number
  penaltyShare?: number
  starterProbability?: number
  lineupStatus?: 'confirmed_starter' | 'bench' | 'unknown' | 'out'
}
```

## Confidence

- Confirmed lineup: `medium`.
- No lineup: `low`.
- Clear injuries: player excluded or probability near zero.
- `high` reserved for a future phase with more robust data.

## Near-Kickoff Refresh

1-hour ISR may not be sufficient for lineups that come out 1 hour before kickoff.

MVP:

- Manual Server Action "Update lineups".
- Protected by auth/rate limit.
- Only available near kickoff.

Future:

- On-Demand Revalidation.
- External cron.

## UI

In the TOP SCORERS section:

- `Lineup confirmed` badge when applicable.
- Small timestamp.
- If no lineup: `Limited data`.
- If player is out: do not show them as a main candidate.

## Risks

### Required API Plan

API-Football (RapidAPI) on the free plan does not have access to the 2026 season.
football-data.org on the free tier does not expose a lineups endpoint.

Until a plan is upgraded, the badge will always show "LIMITED DATA" and
the model will use the historical position-based fallback. The code is ready to activate
automatically when access is available.

To use API-Football: upgrade to a paid plan on RapidAPI and run `pnpm map-fixtures`
to generate `lib/data/fixture-id-map.json` (FD fixture ID → AF fixture ID map).

### Rate Limit

Lineups per fixture may increase consumption.

Mitigation: query only near-kickoff and cache.

### Late Data

The source may not publish lineups in time.

Mitigation: historical fallback and low confidence.

### UI Complexity

Too many labels may saturate the view.

Mitigation: compact badge and details in info tooltip.

---

## Data Contracts

### Data Contract: API-Football Lineups Endpoint

#### Owner Layer

Agent — `lib/agents/lineups-loader.ts`

#### Source

- Provider/file: API-Football RapidAPI — `GET /fixtures/lineups?fixture={fixtureId}`
- Runtime: server-side only; env vars `API_KEY` / `RAPIDAPI_KEY` and `API_HOST` / `RAPIDAPI_HOST`
- Cache/ISR: in-memory per `fixtureId` for the life of the process; ISR does not apply (near-kickoff window)

#### Input Shape

```ts
interface LineupsLoaderInput {
  fixtureId: number
  kickoffUtc: string  // ISO 8601 UTC
}
```

#### Raw API Response Shape

```ts
interface ApiLineupTeam {
  team: { id: number; name: string }
  formation: string | null
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null }
  }>
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null }
  }>
}

interface ApiLineupsResponse {
  response: ApiLineupTeam[]   // len 0 if no lineup; len 2 if confirmed
  errors?: Record<string, string>
}
```

#### Output Shape

```ts
type LineupStatus = 'confirmed_starter' | 'bench' | 'unknown' | 'out'

interface LineupPlayer {
  playerId: number
  playerName: string
  teamId: number
  status: LineupStatus
}

interface FixtureLineupData {
  fixtureId: number
  confirmedAt: string         // ISO 8601 — API response timestamp
  players: LineupPlayer[]     // starters and substitutes from both teams
}
```

#### Nullability and Fallbacks

- Returns `null` if kickoff is more than 2h in the future.
- Returns `null` if API responds with `response.length === 0`.
- Returns `null` if API throws error or exceeds rate limit.
- With `null`, `scorers.ts` applies historical fallback: `starterProbability` estimated by position (`FW=0.7`, `MF=0.5`, `DF=0.3`, `GK=0`), confidence `'low'`.

#### Errors

- Rate limit exceeded: returns `null`; logs warning.
- API key absent: throws in `getEnvVars()` — agent catches and returns `null`.
- Timeout/network: caught in try/catch; returns `null`.
- Full response payloads are not logged in production.

#### Security

- Secrets: `API_KEY`/`RAPIDAPI_KEY` only in server-side env; never `NEXT_PUBLIC_`.
- Client exposure: `lineups-loader.ts` lives in `lib/agents/`; Client Components do not import it.
- Quotas: the existing `RateLimiter` (`95 req/day`) covers this call. Call only near-kickoff to avoid exhausting the quota.

#### Validation

- `response.length` must be exactly 0 or 2; any other value logged as anomaly.
- `startXI.length` expected between 10 and 11; out of range logged as warning.
- Tests: complete lineup (2 teams, 11 starters each), empty lineup (0 teams), API error.

---

### Data Contract: API-Football Injuries Endpoint

#### Owner Layer

Agent — `lib/agents/lineups-loader.ts` (same loader, optional call)

#### Source

- Provider/file: API-Football RapidAPI — `GET /injuries?fixture={fixtureId}`
- Runtime: server-side only
- Cache/ISR: bundled with lineup per `fixtureId`

#### Raw API Response Shape

```ts
interface ApiInjuryItem {
  player: { id: number; name: string }
  team: { id: number }
  fixture: { id: number }
  injury: { type: string; reason: string }
}

interface ApiInjuriesResponse {
  response: ApiInjuryItem[]
  errors?: Record<string, string>
}
```

#### Output Shape

```ts
type InjuryType = 'out' | 'doubtful' | 'suspended'

interface PlayerInjuryData {
  playerId: number
  playerName: string
  teamId: number
  injuryType: InjuryType
  starterProbabilityOverride: number  // 0 for out/suspended; 0.2 for doubtful
}
```

#### Nullability and Fallbacks

- Returns `[]` if API does not respond, returns empty array, or no injury data exists.
- Does not block render: model operates without injury data if unavailable.

#### Errors

- Same patterns as the lineups endpoint: try/catch → `[]`.

#### Security

- Same API key as lineups. Single provider, single shared rate limit.

#### Validation

- Tests: player `out`, player `doubtful`, player `suspended`, empty array.

---

### Data Contract: PlayerScorerInput (Model)

#### Owner Layer

Model — `lib/model/scorers.ts`

#### Source

- Data normalized by `lib/agents/lineups-loader.ts` + historical squad (`lib/data/squads`)
- Does not call APIs; receives already prepared input

#### Input Shape

```ts
interface PlayerScorerInput {
  playerId: number
  playerName: string
  teamId: number
  goalsPerMinute: number           // historical; > 0
  starterProbability: number       // [0, 1]; 1.0 if confirmed starter; estimated if no lineup
  lineupStatus: LineupStatus       // 'confirmed_starter' | 'bench' | 'unknown' | 'out'
  penaltyShare?: number            // optional; [0, 1]
}
```

#### Mapping from Player and FixtureLineupData

| Scenario | starterProbability | lineupStatus |
|---|---|---|
| Confirmed starter | 1.0 | `'confirmed_starter'` |
| Confirmed substitute | 0.1 | `'bench'` |
| No lineup — FW | 0.7 | `'unknown'` |
| No lineup — MF | 0.5 | `'unknown'` |
| No lineup — DF | 0.3 | `'unknown'` |
| No lineup — GK | 0.0 | `'unknown'` |
| Injured / suspended | 0.0 | `'out'` |
| Doubtful | 0.2 | `'unknown'` |

#### Output Shape

No change to `ModelOutput`; confidence changes based on availability:

- Confirmed lineup: `'medium'`
- No lineup: `'low'`
- `'high'` reserved for a future phase with per-match xG data

#### Nullability and Fallbacks

- Players with `lineupStatus === 'out'` or `starterProbability === 0` are excluded from ranking.
- If there are no `PlayerScorerInput` entries, `buildScorerOutputs` returns `emptyOutput` (existing behavior).

#### Validation

- `starterProbability` must be in `[0, 1]`; out of range is an error in sanity check.
- Tests: all starters, all without lineup, one injured player.

---

### Data Contract: lineups-loader Agent Output

#### Owner Layer

Agent — `lib/agents/lineups-loader.ts`

#### Output Shape

```ts
interface LineupsLoaderOutput {
  lineup: FixtureLineupData | null
  injuries: PlayerInjuryData[]
  scorerInputs: PlayerScorerInput[]  // ready to pass to scorers.ts
}
```

#### Cache

- In-memory cache per `fixtureId` within the ISR process.
- Near-kickoff window: only queries API if `now >= kickoffUtc - 2h`.
- No external cache in MVP; On-Demand Revalidation left for a future phase.

#### Related ADR

See `docs/adr/0002-api-football-lineups-near-kickoff.md`.
