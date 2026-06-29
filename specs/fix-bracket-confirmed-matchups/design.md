# Fix Bracket Confirmed Matchups — Design

## Context

Group stage is over. The football-data.org API now returns all 16 Round of 32 fixtures
with real teams. The bracket only needs to prioritise that data over computed projections.

## Architecture

- **Skills**: `computeGroupStandings`, `getGroupPosition`, `getBestThird` in
  `lib/skills/standings.ts` — unchanged; they remain the fallback.
- **Models**: unchanged.
- **Agents**: `lib/agents/live-loader.ts` — no structural changes; already returns all
  fixtures including knockout rounds.
- **UI**: no visual changes.
- **Page** (`app/bracket/page.tsx`): this is where the fix lives. Change in the team
  resolution logic per matchup.

## The Bug

```typescript
// BEFORE (lines 54-66): confirmedTeams is built but never used
const confirmedTeams = new Map<string, { homeId: number; awayId: number }>()
for (const f of allFixtures) {
  if (!f.round || f.round.startsWith('Group Stage')) continue
  // ...
  confirmedTeams.set(String(f.id), { homeId: f.homeTeamId, awayId: f.awayTeamId })
}

// BEFORE (lines 68-98): always uses resolveSlot (standings), ignores confirmedTeams
const matchups: ResolvedMatchup[] = ROUND_OF_32_DEFS.map(def => {
  const home = resolveSlot(def.home, standings, byId)
  const away = resolveSlot(def.away, standings, byId)
  // ...
})
```

## Data and Contracts

### Relevant Fixture shape (from `lib/types.ts`)

```typescript
interface Fixture {
  id: number
  homeTeamId: number    // may be 0 or null when TBD
  awayTeamId: number    // may be 0 or null when TBD
  round: string         // e.g. "LAST_32" for Round of 32
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  homeGoals: number | null
  awayGoals: number | null
  kickoffUtc: string
}
```

### matchId → API fixture mapping problem

`ROUND_OF_32_DEFS` uses synthetic IDs (M73–M88) that do not correspond to real API
fixture IDs. football-data.org returns fixtures with a numeric `id` and the round
in the `round` field.

**Strategy**: Build a map of knockout fixtures by team pair
(`homeTeamId, awayTeamId`) → fixture. When `resolveSlot` returns two confirmed teams,
check if there is a confirmed API fixture with exactly those two teams (in either order)
to obtain the real result if already played.

The core issue is different: when the API already has a Round of 32 fixture with real
teams (homeTeamId and awayTeamId non-null, even if not yet played), those teams must
be used directly without waiting for `resolveSlot` to compute them from standings.

**Improved resolution strategy**:

1. Build an index of confirmed knockout fixtures:
   `Map<string, Fixture>` keyed by `${homeTeamId}:${awayTeamId}` normalised
   (both orderings).
2. For each `BracketMatchupDef`, first try to find an API fixture in the LAST_32 round
   where both teams are confirmed.
3. If no confirmed API fixture exists, fall back to `resolveSlot`.

**Recommended strategy (simplest and most direct)**:

Create `confirmedR32Fixtures`: array of fixtures with
`round === 'LAST_32'` (or other round string variants) and where `homeTeamId` and
`awayTeamId` are non-null and non-zero.

For each `BracketMatchupDef`:
1. Resolve teams from `resolveSlot` (as today).
2. If both teams resolve, check whether a confirmed API fixture exists with those
   two teams (order-independent, since the local bracket order may differ from the
   real home/away order).
3. If a confirmed fixture with a result exists (`status === 'finished'`), use that result.
4. If the API has the same pair but with teams in a different order than `resolveSlot`
   computed, the displayed team is still correct (only home/away labelling differs).

**Critical note**: The reported bug (Colombia vs Ecuador instead of Ghana) suggests that
`resolveSlot` was projecting standings incorrectly because `fixtures-cache.json` was
stale. Refreshing the cache may be enough to fix the immediate bug. The code fix is
preventive for when the API has already confirmed the teams but local standings still
differ (e.g. due to tiebreaker differences).

## UX and Content

No visual changes. The `positionLabel` in the bracket may be adjusted:
- When the team comes from a confirmed API fixture: the label could show the actual
  group (e.g. "1st Group K") or simply the team name.
- Currently `isProjected: true` always — if the team is confirmed by the API, it could
  be `isProjected: false`.

This is optional for this fix; the goal is to get the team name right.

## Security and Runtime

- No security changes.
- ISR revalidate = 3600s in `app/bracket/page.tsx` — unchanged.
- `pnpm refresh-fixtures` must be run manually to update `fixtures-cache.json`
  before deploy.

## Data Contract: confirmed-r32-fixtures

### Owner Layer

Agent (`lib/agents/live-loader.ts` → `FootballDataProvider.fetchFixtures`) → UI Server
Component (`app/bracket/page.tsx`)

### Source

- Provider: `lib/data/providers/football-data.ts` — endpoint `competitions/WC/matches`
- Runtime: Server Component (Vercel ISR, revalidate=3600s)
- Local cache: `lib/data/fixtures-cache.json` (was stale from June 14)

### Input Shape

```ts
// Normalised Fixture arriving at bracket/page.tsx via loadFixtures()
interface Fixture {
  id: number
  homeTeamId: number   // always non-null and non-zero: provider filters out TBD
  awayTeamId: number   // always non-null and non-zero: provider filters out TBD
  kickoffUtc: string
  status: 'scheduled' | 'live' | 'finished'
  homeGoals: number | null   // null if not yet played
  awayGoals: number | null   // null if not yet played
  round: string | null       // raw API stage string for knockout: 'LAST_32', 'LAST_16', etc.
                             // 'Group Stage - Matchday N' for group stage
}
```

### Output Shape

```ts
// New map built in bracket/page.tsx
// Key: "${Math.min(homeTeamId, awayTeamId)}:${Math.max(homeTeamId, awayTeamId)}"
// Value: confirmed API fixture
type ConfirmedR32Pairs = Map<string, Fixture>

// ResolvedTeam updated to indicate whether it comes from the API or a projection
interface ResolvedTeam {
  teamId: number | null
  name: string | null
  positionLabel: string
  isProjected: boolean   // false when team comes from the real API fixture
}
```

### Nullability and Fallbacks

- `homeTeamId` / `awayTeamId`: always non-null in fixtures that pass the provider
  filter (`item.homeTeam?.id != null`). TBD fixtures are removed before reaching
  the component.
- `round`: may be null if the API does not return a stage. `normalizeKnockoutStage`
  (from `lib/skills/bracket.ts`) returns null for groups and null if the string is not
  in `ROUND_MAP`. For Round of 32 it returns `'round_of_32'`.
- If the API has no Round of 32 fixtures yet (group stage not finished or quota
  exceeded): `confirmedR32Pairs` stays empty, bracket falls back to `resolveSlot` as
  today. Safe degradation.

### Round key for filtering Round of 32

```ts
// CORRECT: use normalizeKnockoutStage from lib/skills/bracket.ts
import { normalizeKnockoutStage } from '@/lib/skills/bracket'

const r32Fixtures = allFixtures.filter(
  f => normalizeKnockoutStage(f.round) === 'round_of_32'
)
```

**Do not** use `f.round === 'LAST_32'` directly: the API may send `'ROUND_OF_32'` or
another alias. `ROUND_MAP` in bracket.ts covers both variants.

### Errors

- API with no Round of 32 data (quota exceeded, API delayed): `r32Fixtures` is empty →
  bracket works with projections, no UI error.
- Stale cache without full group results: `computeGroupStandings` computes incorrect
  standings → wrong projected matchups (the original bug). Fixed by `pnpm refresh-fixtures`.

### Security

- Secrets: `FOOTBALLDATA_KEY` only in the Vercel server-side runtime environment.
  Never exposed to the client.
- Client exposure: none. `app/bracket/page.tsx` is a Server Component.
- Quotas: 10 requests/min in the provider. A 1h revalidate prevents rate limiting.

### Validation

- `pnpm refresh-fixtures` → verify that `fixtures-cache.json` has `count > 72` and
  that fixtures with `round: 'LAST_32'` exist.
- In `bracket/page.tsx`: temporary `console.log` with the number of confirmed R32
  fixtures found.
- Acceptance: Colombia (id: 20) and Ghana (id: 135) must appear as the pair for M83.

## Testing Strategy

1. Unit: verify that `resolveSlot` fallback still works with empty fixtures.
2. Manual: open `/bracket` on the Vercel preview and confirm that all 16 fixtures show
   the correct teams (especially Colombia vs Ghana for M83).
3. Build: `pnpm tsc --noEmit` and `pnpm build`.
