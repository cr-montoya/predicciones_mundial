# Live Top Scorers — Design

## Context

The "Golden Boot Candidates" section shows model Monte Carlo probabilities precomputed
in `lib/data/tournament-prediction.json`. This JSON is only updated when `pnpm precompute`
is run manually, which means that during the tournament the real goals of players (and
therefore their probabilities) become outdated.

The solution extends the `live-loader` agent to fetch real top scorers at runtime with ISR,
and enriches the UI to show current goals alongside the probability.

The endpoint `football-data.org /v4/competitions/WC/scorers` is already used in the script
`precompute-tournament.ts` (lines 35–55), so the fetch logic is known and verified.

## Architecture

- **Skills**:
  - New pure skill `lib/skills/normalize-scorer-name.ts` that exports:
    - `normalizeName(name: string): string` — removes diacritics, lowercase, trim.
    - `mergeScorersWithCandidates(candidates: CandidateRow[], liveScorers: LiveScorer[]): CandidateRow[]`
      — pure function that merges JSON probabilities with real goals, without I/O.
  - The same `normalizeName` is imported by `scripts/precompute-tournament.ts` to avoid
    duplicating logic (replaces the local `normalize` function in the script).
- **Models**: no changes to the Monte Carlo model.
- **Agents**: extend `lib/agents/live-loader.ts` with `fetchLiveScorers(): Promise<LiveScorer[]>` that calls the endpoint, parses to `LiveScorer[]`, and applies ISR. The agent calls the merge skill with the JSON candidates and real scorers, returning `CandidateRow[]` ready for the UI.
- **UI**: `components/candidates.tsx` receives `candidates: CandidateRow[]` (already merged and sorted) and `computedAt: string`. It only renders — does not import `lib/agents`, `lib/model`, or `lib/skills`.

## Data and Contracts

### Type `LiveScorer`

```ts
// lib/skills/normalize-scorer-name.ts
interface LiveScorer {
  playerId: number      // player.id from the API; 0 if the field is not in the response
  playerName: string    // player.name from the API
  teamId: number        // toCanonicalTeamId(team.id) using FD_TEAM_MAP
  goals: number         // only entries with goals > 0
  assists: number       // 0 if the football-data.org tier does not include it
}
```

`FD_TEAM_MAP` must be extracted to `lib/data/fd-team-map.ts` (avoid duplication:
currently exists in `lib/data/providers/football-data.ts` and in
`scripts/precompute-tournament.ts`). The agent imports the map from `lib/data/`.

### Endpoint

```
GET https://api.football-data.org/v4/competitions/WC/scorers?season=2026&limit=50
Headers: { 'X-Auth-Token': process.env.FOOTBALLDATA_KEY }
```

Expected response (simplified):
```json
{
  "scorers": [
    {
      "player": { "id": 44, "name": "Lionel Messi" },
      "team": { "id": 762, "name": "Argentina" },
      "goals": 5,
      "assists": 2
    }
  ]
}
```

`assists` may be absent on the free plan; the parser must default to `0`.
`player.id` may be absent; the parser must default to `0`.

### Candidate Merge

```ts
// lib/skills/normalize-scorer-name.ts
export interface CandidateRow {
  playerName: string
  teamId: number | null        // for name+team join; null if unavailable in JSON
  probability: number | null   // from precomputed JSON; null if not in top
  goals: number | null         // from live scorers; null if no goals in tournament
}

export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function mergeScorersWithCandidates(
  candidates: CandidateRow[],
  liveScorers: LiveScorer[],
): CandidateRow[]
```

Merge logic (in the pure skill, called from `lib/agents/live-loader.ts`):
1. Take candidates from the precomputed JSON (all, no limit of 5).
2. Take real scorers with goals > 0.
3. Join by **`normalizeName(playerName) + teamId`** as composite key (eliminates
   collisions from mononyms or common surnames). Fallback to name-only if the
   JSON candidate has no `teamId`. `LiveScorer.teamId` is already in the contract,
   and `CandidateRow` must include `teamId: number | null` to enable this join.
4. Result: unique list — players appearing in at least one source.
5. Sort:
   - First: players with real goals (desc by goals).
   - Tiebreak within that group: desc by probability.
   - Then: players without real goals (desc by probability).
6. The UI shows top 5 collapsed, expandable to the full list (same as today).

### Cache / ISR

Use `apiFetch` from `lib/data/api-fetch.ts` instead of direct `fetch`, to
inherit the `AbortSignal.timeout(10s)`, 3-attempt backoff, and the `RateLimiter`
already configured for football-data.org. Pass `{ revalidate: DATA_REVALIDATE_SECONDS }`
as a cache option. Validate `Array.isArray(data?.scorers)` before mapping to
resist error envelopes with 2xx.

### Fallback

If the fetch fails or returns empty `scorers`:
- Return `[]` as `liveScorers`.
- The UI shows precomputed JSON candidates with goals `null` (column `—`).
- No visible error to the user.

## UX and Content

### Goals Column

- Fixed column between name and `%`: `w-16 text-right shrink-0 tabular-nums`.
- If `goals === null` or `goals === 0`: show `—` in muted grey tone (`#555`).
- If `goals >= 1`: show `1 goal` / `5 goals` (singular/plural). The number in green
  (`#02B906`) distinguishes real data from the model (gold `#FFDB00`/`#D4A843`).
- Do not use "actual" — simply `5 goals`.

### Visual Order

- The player with the most real goals appears first, even if their probability is lower
  than another candidate.
- The numeric rank (1, 2, 3…) must reflect the new merged order.

### Last Precompute Date

- Show `computedAt` from the JSON below the section title in format
  `Probabilities calculated: DD/MM/YYYY` in faint grey (`#6b6d75`, 11px).
- The label explicitly scopes to the model (not to real goals, which are fresher via ISR).

### Empty State / Loading

- If `liveScorers` empty and JSON has candidates: show candidates without the goals column
  (no extra column, no error message).
- No loading skeleton (Server Component with ISR).

## Security and Runtime

- `FOOTBALLDATA_KEY` must be used exclusively in `lib/agents/live-loader.ts` (server-
  side). Never pass the key to the client or to `NEXT_PUBLIC_` variables.
- The fetch occurs in the Server Component tree; no Client Component touches the agent.
- ISR ensures the request is not made on every visit, only when the cache expires.
- The football-data.org scorers endpoint has a request limit based on the plan;
  with ISR of 3600s the impact is minimal (1 request/hour per route, not per visit).

## Testing Strategy

- **Unit**: test of the scorer response parser/normalizer (mock data).
- **Unit**: test of the merge logic with known data — verify that Messi with
  5 goals appears first even if their precomputed probability is low.
- **Unit**: test of the fallback when the fetch fails (returns `[]`).
- **Build**: `pnpm build` must pass without type errors.
- **Manual**: verify in Vercel preview that the section shows real goals.
- **Manual**: verify that if `FOOTBALLDATA_KEY` is disabled, the section still
  shows JSON candidates (degradation).
