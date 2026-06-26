# phase-26-picks-reminder — Design

## New Files

| File | Description |
|---|---|
| `components/picks-reminder-banner.tsx` | Client Component: banner on home |
| `components/fixtures-nav-badge.tsx` | Client Component: inline badge in nav |

## Modified Files

| File | Change |
|---|---|
| `app/page.tsx` | Pass `fixtures={fixturesToday.map(f => f.fixture)}` to the banner |
| `components/nav.tsx` | Add `<FixturesNavBadge />` inline after the label in the `/fixtures` tab |

## Data Contract

`app/page.tsx` already has `fixturesToday: FixtureWithTeams[]` from `loadHomeData()`.
The banner receives the flat fixture list:

```ts
// in app/page.tsx
<PicksReminderBanner fixtures={fixturesToday.map(f => f.fixture)} />
```

Banner prop: `{ fixtures: Fixture[] }`.

## Detection Logic (Client Component, `useEffect`)

```ts
function getUnpickedSoon(fixtures: Fixture[]): Fixture[] {
  const now = Date.now()
  const sixHours = 6 * 60 * 60 * 1000
  return fixtures.filter((f) => {
    if (f.status !== 'scheduled') return false
    const kickoff = new Date(f.kickoffUtc).getTime()
    if (kickoff - now > sixHours || kickoff < now) return false
    return !localStorage.getItem(`pick_${f.id}`)
  })
}
```

## Dismiss

```ts
const DISMISS_KEY = 'picks_banner_dismissed'
const today = new Date().toISOString().slice(0, 10)  // 'YYYY-MM-DD'
const dismissed = localStorage.getItem(DISMISS_KEY) === today
```

On close: `localStorage.setItem(DISMISS_KEY, today)` — persists until the next day (date-scoped).

## Banner → Badge Communication via localStorage

When the banner detects the count (in `useEffect`):
```ts
localStorage.setItem('upcoming_unpicked_count', String(count))
```

`FixturesNavBadge` reads `Number(localStorage.getItem('upcoming_unpicked_count')) || 0` in its own `useEffect`. Does not require changes to `app/layout.tsx`.

## Visual Design — PicksReminderBanner

**Note: the codebase uses inline `style` objects, NOT Tailwind classes.**

Insertion point in `app/page.tsx`: between `<Hero>` and the `<LastUpdated>` block.
Wrap in `<FadeIn>` (existing component).

Render `null` if `count === 0 || dismissed` (safe in SSR — state starts at `{count:0,dismissed:false}` until `useEffect` runs).

### Outer container (inside FadeIn)

```ts
style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  background: 'rgba(255,219,0,0.06)',
  border: '1px solid rgba(255,219,0,0.18)',
  borderRadius: 8,
  padding: '12px 14px',
  marginBottom: 20,
}}
```

### Left block (icon + text)

```ts
style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px', minWidth: 0 }}
```

- Pulsing dot: `width:8, height:8, borderRadius:'50%', background:'#FFDB00', flexShrink:0`
  With `animation: 'pulseGlow 2s infinite'` (keyframe already in `globals.css`).
- Text: `fontSize:13, fontWeight:600, color:'#f0ece4', lineHeight:1.3`.
  The number goes in `<strong style={{ color:'#FFDB00' }}>`.

### Copy (singular/plural)

- 1 match: `You have 1 upcoming match without a pick · Make your prediction`
- N matches: `You have {n} upcoming matches without a pick · Make your prediction`

Do not use exclamation marks. Sober tone, consistent with the rest of the app.

### Right block (CTA + close)

```ts
style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}
```

CTA `<Link href="/fixtures">`:
```ts
style={{
  fontSize: 12, fontWeight: 700, letterSpacing: '0.5px',
  textTransform: 'uppercase', color: '#08090d',
  background: '#FFDB00', padding: '7px 14px',
  borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap',
}}
```
Label: `VIEW MATCHES →`

Close button:
```ts
style={{
  width: 28, height: 28, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, color: '#6b6d75', fontSize: 16, lineHeight: 1, cursor: 'pointer',
}}
aria-label="Close notice"
```
Content: `×`. onClick: `setDismissed(true)` + `localStorage.setItem(DISMISS_KEY, today)`.

## Visual Design — FixturesNavBadge

Inline badge, immediately after the "Fixtures" label in `nav.tsx`.
`nav.tsx` is already a Client Component — just add import and conditional rendering.

```ts
style={{
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 16,
  height: 16,
  padding: '0 5px',
  marginLeft: 6,
  borderRadius: 8,
  background: '#E5342B',   // red — distinguishes from gold accents
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
  verticalAlign: 'middle',
  flexShrink: 0,
}}
```

Show `9+` when count > 9. Hide (`return null`) when count === 0.

## Safe Hydration

Both components render `null` in SSR. Initial state: `count = 0`, `dismissed = false`.
`useEffect` runs only on the client after mounting. The banner appears ~100ms after mounting — acceptable for a reminder.

## Security and Runtime

- No secrets. Fixtures are passed as props from the Server Component parent.
- `localStorage` only contains fixture IDs and the dismiss date — no PII.

## Testing Strategy

- No upcoming matches → banner and badge not rendered.
- With upcoming matches without pick → banner visible, badge with correct count.
- Dismiss → banner hidden until next day.
- No hydration mismatch: SSR renders `null`, client mounts with correct count.
