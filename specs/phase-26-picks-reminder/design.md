# phase-26-picks-reminder — Design

## Archivos nuevos

| Archivo | Descripción |
|---|---|
| `components/picks-reminder-banner.tsx` | Client Component: banner en home |
| `components/fixtures-nav-badge.tsx` | Client Component: badge inline en nav |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | Pasar `fixtures={fixturesToday.map(f => f.fixture)}` al banner |
| `components/nav.tsx` | Agregar `<FixturesNavBadge />` inline después del label en el tab de `/fixtures` |

## Data contract

`app/page.tsx` ya tiene `fixturesToday: FixtureWithTeams[]` de `loadHomeData()`.
El banner recibe la lista de fixtures planos:

```ts
// en app/page.tsx
<PicksReminderBanner fixtures={fixturesToday.map(f => f.fixture)} />
```

Prop del banner: `{ fixtures: Fixture[] }`.

## Lógica de detección (Client Component, `useEffect`)

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

Al cerrar el banner: `localStorage.setItem(DISMISS_KEY, today)` — persiste hasta el día siguiente (date-scoped).

## Comunicación banner → badge vía localStorage

Cuando el banner detecta el count (en `useEffect`):
```ts
localStorage.setItem('upcoming_unpicked_count', String(count))
```

`FixturesNavBadge` lee `Number(localStorage.getItem('upcoming_unpicked_count')) || 0` en su propio `useEffect`. No requiere cambios en `app/layout.tsx`.

## Diseño visual — PicksReminderBanner

**Nota: el codebase usa inline `style` objects, NO clases de Tailwind.**

Punto de inserción en `app/page.tsx`: entre `<Hero>` y el bloque de `<LastUpdated>`.
Envolver en `<FadeIn>` (componente existente).

Render `null` si `count === 0 || dismissed` (seguro en SSR — el estado arranca en `{count:0,dismissed:false}` hasta que corre `useEffect`).

### Contenedor externo (dentro de FadeIn)

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

### Bloque izquierdo (icono + texto)

```ts
style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px', minWidth: 0 }}
```

- Dot pulsante: `width:8, height:8, borderRadius:'50%', background:'#FFDB00', flexShrink:0`
  Con `animation: 'pulseGlow 2s infinite'` (keyframe ya existe en `globals.css`).
- Texto: `fontSize:13, fontWeight:600, color:'#f0ece4', lineHeight:1.3`.
  El número va en `<strong style={{ color:'#FFDB00' }}>`.

### Copy (singular/plural)

- 1 partido: `Tienes 1 partido próximo sin pick · Haz tu predicción`
- N partidos: `Tienes {n} partidos próximos sin pick · Haz tu predicción`

No usar "hoy" ni exclamaciones. Tono sobrio, consistente con el resto de la app.

### Bloque derecho (CTA + cierre)

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
Label: `VER PARTIDOS →`

Botón de cierre:
```ts
style={{
  width: 28, height: 28, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, color: '#6b6d75', fontSize: 16, lineHeight: 1, cursor: 'pointer',
}}
aria-label="Cerrar aviso"
```
Contenido: `×`. onClick: `setDismissed(true)` + `localStorage.setItem(DISMISS_KEY, today)`.

## Diseño visual — FixturesNavBadge

Badge inline, inmediatamente después del label "Partidos" en `nav.tsx`.
`nav.tsx` ya es Client Component — solo agregar import y renderizado condicional.

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
  background: '#E5342B',   // rojo — distingue de los accents dorados
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
  verticalAlign: 'middle',
  flexShrink: 0,
}}
```

Mostrar `9+` cuando count > 9. Ocultar (`return null`) cuando count === 0.

## Hidratación segura

Ambos componentes renderizan `null` en SSR. Estado inicial: `count = 0`, `dismissed = false`.
`useEffect` corre solo en el cliente después del montaje. El banner aparece ~100ms después del montaje — aceptable para un recordatorio.

## Security and Runtime

- Sin secrets. Fixtures se pasan como props desde el Server Component padre.
- `localStorage` solo contiene IDs de fixtures y fecha de dismiss — sin PII.

## Testing Strategy

- Sin partidos próximos → banner y badge no se renderizan.
- Con partidos próximos sin pick → banner visible, badge con conteo correcto.
- Dismiss → banner oculto hasta el día siguiente.
- Sin hydration mismatch: SSR renderiza `null`, cliente monta con count correcto.
