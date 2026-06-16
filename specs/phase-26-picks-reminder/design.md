# phase-26-picks-reminder — Design

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `components/picks-reminder-banner.tsx` | Client Component: banner en home |
| `components/fixtures-nav-badge.tsx` | Client Component: badge en nav link |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | Incluir `<PicksReminderBanner fixtures={upcomingFixtures} />` |
| `app/layout.tsx` | Incluir `<FixturesNavBadge>` en el nav link de Fixtures |

## Lógica de detección (Client Component, `useEffect`)

```ts
function getUnpickedSoon(fixtures: Fixture[]): Fixture[] {
  const now = Date.now()
  const sixHours = 6 * 60 * 60 * 1000
  return fixtures.filter((f) => {
    if (f.status !== 'scheduled') return false
    const kickoff = new Date(f.kickoffUtc).getTime()
    if (kickoff - now > sixHours || kickoff < now) return false
    const stored = localStorage.getItem(`pick_${f.id}`)
    return !stored
  })
}
```

## Dismiss

```ts
const DISMISS_KEY = 'picks_reminder_dismissed'
const today = new Date().toISOString().slice(0, 10)  // 'YYYY-MM-DD'
const dismissed = localStorage.getItem(DISMISS_KEY) === today
```

Al cerrar el banner: `localStorage.setItem(DISMISS_KEY, today)`.

## Diseño visual del banner

```
┌──────────────────────────────────────────────────────┐
│  ⚽  2 partidos hoy sin pick — ¡no te quedes fuera!  │
│  [ Ver partidos → ]                        [ × ]     │
└──────────────────────────────────────────────────────┘
```

- Fondo: `rgba(255,219,0,0.07)`, borde `rgba(255,219,0,0.2)`.
- Texto en dorado tenue.
- Aparece arriba del fold en la home, con `FadeIn`.

## Badge en nav

Círculo rojo pequeño con número (tipo notification dot) sobre el link "FIXTURES".
Se oculta si `count === 0`.

## Hidratación segura

Renderizar `null` en SSR; montar con `useEffect` + `useState` en el cliente para
evitar hydration mismatch. El banner aparece ~100ms después del montaje.

## Security and Runtime

- Sin secrets. Los fixtures se pasan como props desde el Server Component padre.
- localStorage solo contiene IDs de fixtures y fechas de dismiss — sin PII.

## Testing Strategy

- Sin partidos próximos → banner y badge no se renderizan.
- Con partidos próximos sin pick → banner visible, badge con conteo correcto.
- Dismiss → banner oculto; al día siguiente vuelve a aparecer.
- Sin hydration mismatch: renderizar en SSR → el banner no aparece hasta que
  `useEffect` corre en el cliente.
