# Design: Phase 17 - Implicit Bookmaker Probabilities

## ADR

- [ADR 0001: Adoption of The Odds API as market probability provider](../../docs/adr/0001-the-odds-api-provider.md)

## Approach

Add a market reference layer without contaminating the model. External odds must not
change the AI probabilities; they only serve to compare and explain discrepancies.

## Proposed Architecture

```
The Odds API
   -> lib/agents/odds-loader.ts
   -> odds normalization
   -> lib/data/odds-cache.json or ISR/server cache
   -> lib/model/skills/value-calc.ts
   -> markets UI
```

## Odds Agent

`lib/agents/odds-loader.ts` must:

- Read API key from server-side env.
- Call The Odds API.
- Normalize team/fixture names.
- Convert decimal odds to raw probabilities.
- Adjust overround per market.
- Return typed structure for UI/model skills.

## Pure Value Skill

`lib/model/skills/value-calc.ts`:

```ts
interface ValueInput {
  modelProbability: number
  marketProbability: number
}

interface ValueOutput {
  diff: number
  label: 'VALOR+' | 'VALOR-' | 'NEUTRO'
}
```

Thresholds approved by Analyst (`VALUE_THRESHOLD = 0.08`):

- `VALOR+`: `diff >= 0.08`.
- `VALOR-`: `diff <= -0.08`.
- `NEUTRO`: `-0.08 < diff < 0.08`.

Additional rule: if `bookmakerCount < 2`, do not emit a value label (show without label).
The ±0.05 threshold was discarded as it falls below the combined noise of the model (~10 pp) and overround (4–8%).
Define the threshold as a named constant for easier future adjustments.

## Overround

For a market with raw probabilities:

```txt
raw_i = 1 / decimalOdd_i
overround = sum(raw_i)
adjusted_i = raw_i / overround
```

After adjustment, the market must sum to 1.0. Before adjustment, the sum is the overround (typically 1.04–1.08), not ~1.

**The two markets are normalized separately**: 1X2 normalizes its 3 outcomes, O/U normalizes its 2. Do not mix all five fields in a single normalization.

Mandatory guards in the agent:
- `decimalOdd > 1.0` — decimal odd is always greater than 1; if it arrives <= 1.0, discard and return `null`.
- `overround > 0` — avoid division by zero; if 0 return `null`.

## UI

### Component: subordinate reference row

Render a **reference row below the `ProbabilityBar`** for each outcome in the MVP markets (the 3 outcomes of 1X2 and the 2 of O/U 2.5). Structure per outcome:

```
[ProbabilityBar — AI 54%]          ← existing, unchanged
└ Market 47%  ·  AI +7 pp  [VALOR+]   ← new row, text-xs
```

- Flex row, `text-xs`, margin-top ~4px, no card, no border, no background.
- "Market" and number in `tabular-nums`, color `var(--muted)` for the word and `#9a9ca3` for the number.
- Differential in `tabular-nums`: `AI +7 pp` / `AI -4 pp` / `AI 0 pp`.
- VALOR pill with confidence badge geometry: `fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, letterSpacing: 1`.
- New component: `components/market-reference.tsx`, used only in `market-section.tsx` for the 2 MVP markets.

### Color System for VALOR Labels

Palette on dark background. Do NOT use green/red (avoid betting/danger semantics):

- `VALOR+`: `bg: rgba(255,219,0,0.12)`, `color: #FFDB00` (gold, token `--accent`).
- `VALOR-`: `bg: rgba(212,168,67,0.10)`, `color: #D4A843` (amber, token `--accent2`).
- `NEUTRO`: `bg: rgba(255,255,255,0.06)`, `color: #6b6d75` (muted, same as LOW badge).

### States

- **With available odds**: reference row with market %, differential, and VALOR pill (if `bookmakerCount >= 2`).
- **Without odds (`OddsResult null`)**: a single muted line `No market reference` only on MVP markets. Reserve the same height for visual stability.
- **Non-MVP markets**: render nothing, no placeholder.

### Approved Copy

- Section title (if grouped): `MARKET REFERENCE`
- Market estimate: `Market {pct}%` (e.g., `Market 47%`)
- Differential: `AI +7 pp`, `AI -4 pp`, `AI 0 pp`
- Internal labels: `VALOR+`, `VALOR-`, `NEUTRO`
- Placeholder: `No market reference`
- Optional microcopy in popover: `Average of {n} bookmakers`
- Disclaimer: reuse existing `DisclaimerBanner`. Do not add a second disclaimer.

### Mobile

The row is `text-xs` in natural flow below the bar: it stacks without intervention. Use `flex flex-wrap items-center gap-x-2 gap-y-1`. The differential remains visible on mobile (it is the hook). The bookmakerCount microcopy may be omitted on mobile (lives only in popover).

### DO NOT use

- Green/red on VALOR labels (betting/danger semantics).
- "Bet", "betting", "pick", "sure", "guaranteed", "value bet", "EV+", "books", "consensus".
- Raw decimal odds in UI (only probability in %).
- Second disclaimer banner.
- Card with border/background for the comparison.
- Animations or hover reveals on the differential.
- Bookmaker logos or names.

## Data and Cache

The Odds API free tier is limited. Strategies:

- Cache per fixture/market.
- Revalidate at most every hour.
- Do not call API from client.
- If no odds, show "no market reference".

## Data Contract: OddsLoader

### Owner Layer

Agent (`lib/agents/odds-loader.ts`)

### Source

- Provider: The Odds API (`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds`)
- Runtime: Next.js server (never client)
- Cache/ISR: `next/cache` with `revalidate: 3600` (1 hour per fixture)

### Input Shape

```ts
// Agent call parameters
interface OddsLoaderInput {
  homeTeam: string   // normalized home team name
  awayTeam: string   // normalized away team name
  commenceTime?: string  // ISO 8601, to filter by date
}
```

### Output Shape

```ts
interface MarketOdds {
  homeWin: number       // adjusted probability [0, 1]
  draw: number          // adjusted probability [0, 1], only in 1X2
  awayWin: number       // adjusted probability [0, 1]
  over25: number | null // adjusted probability [0, 1], null if not applicable
  under25: number | null
  bookmakerCount: number
  fetchedAt: string     // ISO 8601
}

// null when no odds available for the match
type OddsResult = MarketOdds | null
```

```ts
// Raw shape from The Odds API (relevant fields only)
interface OddsAPIResponse {
  id: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: Array<{
    key: string
    markets: Array<{
      key: 'h2h' | 'totals'
      outcomes: Array<{
        name: string   // team or "Over"/"Under"
        price: number  // decimal odd
        point?: number // line (e.g., 2.5 for O/U)
      }>
    }>
  }>
}
```

### Nullability and Fallbacks

- If API does not respond (timeout, HTTP error): return `null`, do not throw exception.
- If no bookmakers for the match: return `null`.
- If only `h2h` data but no `totals`: return partial odds with `over25: null`.
- UI must handle `null` by showing "No market reference".

### Errors

- HTTP 401/403: invalid or expired API key — log on server, return `null`.
- HTTP 429: quota exhausted — log with timestamp, return `null`, do not retry.
- HTTP 5xx: provider error — return `null`.
- Timeout > 3000ms: return `null`.

### Security

- Secrets: `THE_ODDS_API_KEY` in Vercel env vars, never in committed `.env.local`.
- Client exposure: none. Only the agent calls the API.
- Quotas: 500 req/month free tier. 1h cache reduces calls to max ~64 per match.

### Validation

- `sum(homeWin + draw + awayWin)` must be exactly 1.0 post-overround.
- `sum(over25 + under25)` must be exactly 1.0 if both exist.
- Each adjusted probability must be in `[0, 1]`.
- `diff` in `ValueOutput` must be in `[-1, 1]`.
- Unit tests in `lib/model/skills/__tests__/value-calc.test.ts`.

## Data Contract: ValueCalc

### Owner Layer

Skill (`lib/model/skills/value-calc.ts`)

### Input Shape

```ts
interface ValueInput {
  modelProbability: number    // [0, 1] — from the proprietary Poisson model
  marketProbability: number   // [0, 1] — from adjusted OddsResult
}
```

### Output Shape

```ts
interface ValueOutput {
  diff: number                        // modelProbability - marketProbability, range [-1, 1]
  label: 'VALOR+' | 'VALOR-' | 'NEUTRO'
}
```

### Nullability and Fallbacks

- If `marketProbability` is `null` or `undefined`: do not call the skill; UI shows empty state.
- The skill is pure: it never receives `null` directly; the caller filters beforehand.

### Validation

- Approved thresholds: `VALOR+ >= 0.08`, `VALOR- <= -0.08`, `NEUTRO` in between.
- `bookmakerCount >= 2` to emit label; with a single bookmaker, no label.
- Known-good sanity checks (Brazil vs Mexico odds):
  - 1X2 odds: [1.80, 3.60, 4.50] → raw [0.556, 0.278, 0.222] → overround 1.056 → adjusted [0.526, 0.263, 0.211] → sum 1.000
  - O/U odds: [1.95, 1.90] → raw [0.513, 0.526] → overround 1.039 → adjusted [0.494, 0.506] → sum 1.000
  - Value: modelProb=0.62, marketProb=0.526 → diff=+0.094 → VALOR+
  - Value: modelProb=0.40, marketProb=0.526 → diff=-0.126 → VALOR-
  - Value: modelProb=0.56, marketProb=0.526 → diff=+0.034 → NEUTRO
- Edge cases: odd <= 1.0 → null; overround = 0 → null; exact diff ±0.08 → inclusive boundary in VALOR; bookmakerCount < 2 → no label.

---

## Risks

### Team Matching

Bookmakers may use different names than the providers.

Mitigation: name normalizer and manual fallback if needed.

### API Quota

500 req/month can run out quickly.

Mitigation: limit to upcoming matches and MVP markets.

### Perception as Financial Advice

Comparing with bookmakers may sound like a recommendation.

Mitigation: informational copy and prominent disclaimer.
