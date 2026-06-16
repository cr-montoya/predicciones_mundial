# phase-19-picks — Design

## Arquitectura de capas

```
UI (Client Component: PickPanel)
  ↓ recibe: Fixture (prop desde Server Component padre)
  ↓ lee/escribe: localStorage
  ↓ llama: resolveVerdict (skill pura)
```

No hay agent ni model nuevos. La skill es pura, sin red ni storage.

## Archivos nuevos

| Archivo | Capa | Descripción |
|---|---|---|
| `lib/skills/picks.ts` | Skill | `resolveVerdict`, `deriveOutcome`. Funciones puras. |
| `components/pick-panel.tsx` | UI | Client Component. Botones 1X2, estado bloqueado, veredicto. |
| `components/pick-badge.tsx` | UI | Client Component pequeño. Badge "ya hiciste pick" en tarjetas. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/fixtures/[id]/page.tsx` | Incluir `<PickPanel fixture={fixture} />` sobre las predicciones. |
| `app/fixtures/page.tsx` | Incluir `<PickBadge fixtureId={f.id} />` en cada tarjeta. |
| `lib/skills/picks.ts` | Nuevo — ver contrato abajo. |

## Contrato de Skill (`lib/skills/picks.ts`)

```ts
export type PickOutcome = 'home' | 'draw' | 'away'

export interface StoredPick {
  fixtureId: number
  outcome: PickOutcome
  pickedAt: string
}

/** Convierte el marcador final en el outcome real del partido. */
export function deriveOutcome(homeGoals: number, awayGoals: number): PickOutcome {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/** Compara el pick del usuario con el resultado real. */
export function resolveVerdict(
  pick: PickOutcome,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' {
  return pick === deriveOutcome(homeGoals, awayGoals) ? 'correct' : 'incorrect'
}
```

## Diseño visual de `PickPanel`

### Estado scheduled (pick pendiente)

```
┌─────────────────────────────────────────────┐
│  TU PICK                                    │
│                                             │
│  [ 🏠 Local ]  [ = Empate ]  [ ✈ Visita ]  │
│                                             │
│  Elige antes de que empiece el partido      │
└─────────────────────────────────────────────┘
```

### Estado scheduled (pick hecho)

```
┌─────────────────────────────────────────────┐
│  TU PICK                                    │
│                                             │
│  [ 🏠 Local ✓ ]  [ = Empate ]  [ ✈ Visita] │
│                                             │
│  Puedes cambiar hasta el inicio             │
└─────────────────────────────────────────────┘
```

### Estado live (bloqueado)

```
┌─────────────────────────────────────────────┐
│  TU PICK  · EN CURSO                        │
│                                             │
│  [ 🏠 Local ✓ ]  (bloqueado)               │
└─────────────────────────────────────────────┘
```

### Estado finished — pick correcto

```
┌─────────────────────────────────────────────┐
│  TU PICK  · ✓ ACERTASTE                    │
│                                             │
│  Elegiste: Local  →  Resultado: 2-1        │
└─────────────────────────────────────────────┘
```

### Estado finished — pick incorrecto

```
┌─────────────────────────────────────────────┐
│  TU PICK  · ✗ FALLASTE                     │
│                                             │
│  Elegiste: Empate  →  Resultado: 2-1       │
└─────────────────────────────────────────────┘
```

### Estado finished sin pick

No se renderiza el componente.

## Paleta

- Botón sin seleccionar: fondo `rgba(255,255,255,0.04)`, borde `rgba(255,255,255,0.08)`
- Botón seleccionado: borde `#FFDB00`, fondo `rgba(255,219,0,0.08)`
- Veredicto correcto: acento verde `#22c55e`
- Veredicto incorrecto: acento rojo `#ef4444`
- Badge en tarjeta: punto dorado `#FFDB00` + texto "Pick hecho"

## localStorage key

```
`pick_${fixtureId}` → JSON.stringify(StoredPick)
```

## Posición en `app/fixtures/[id]/page.tsx`

`<PickPanel>` va entre el header del partido (equipos + hora) y la sección de
predicciones de la IA. El usuario ve primero su pick, luego lo contrasta con las
probabilidades del modelo.
