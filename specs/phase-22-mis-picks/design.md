# phase-22-mis-picks — Design

## Route

`app/mis-picks/page.tsx` — Server Component layout + inner Client Component that
reads localStorage.

## Architecture

```
app/mis-picks/page.tsx  (Server Component)
  ↓ loadFixtures() → passes fixtures as prop
  → <MisPicksClient fixtures={fixtures} />  (Client Component)
      ↓ reads localStorage: pick_${id} for each fixture
      → groups into: pending / in-progress / resolved
      → renders sections + counter
```

Passing fixtures from the server avoids an extra call from the client and
keeps the API key server-side.

## New Files

| File | Description |
|---|---|
| `app/mis-picks/page.tsx` | Server Component shell |
| `components/mis-picks-client.tsx` | Client Component with localStorage logic |
| `components/pick-result-row.tsx` | Individual pick row with verdict |

## Visual Design

### Counter
```
┌──────────────────────────────────────┐
│  MY PICKS                            │
│  7 correct / 10 resolved  → 70%     │
│  ████████████████░░░░░░              │
└──────────────────────────────────────┘
```

### Resolved pick row
```
Argentina vs France  ·  2-1
My pick: Home  →  ✓ CORRECT
```

### Empty state
```
You have no saved picks yet.
[ View matches → ]
```

## Reuse

`resolveModelVerdict` from `lib/skills/accuracy.ts` (phase-20) can be reused
for the verdict, but the user's pick verdict is `resolveVerdict` from
`lib/skills/picks.ts` (phase-19). They are different functions — one for the model,
one for the user.

## Security and Runtime

- No secrets in Client Component. Fixtures are passed as props from the
  Server Component parent — the API key never reaches the client.
- localStorage is not encrypted; picks are entertainment data, without PII.

## Testing Strategy

- Hydration: render with SSR → no mismatch (null server-side, mount client-side).
- Empty state: no picks in localStorage → CTA visible.
- Verdicts: resolved picks with correct/incorrect result → correct verdict.
- Counter: `7/10 = 70%` must be exact.
