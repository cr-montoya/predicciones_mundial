# phase-20-accuracy — Design

## Arquitectura de capas

```
UI (Server Components)
  ↓ lee: Fixture[] + computePredictionsRetroactive()
  ↓ llama: resolveModelVerdict, computeAccuracyStats (skills puras)
  ↓ renderiza: ModelResultCard, AccuracyWidget
```

No hay agents nuevos. Todo se resuelve en server components con las skills puras y
la función retroactiva del model.

## Archivos nuevos

| Archivo | Capa | Descripción |
|---|---|---|
| `lib/skills/accuracy.ts` | Skill | `deriveActualOutcome`, `topModelCall`, `resolveModelVerdict`, `computeAccuracyStats`. Funciones puras. |
| `components/model-result-card.tsx` | UI | Server Component. Muestra predicción retroactiva + veredicto en fixture finalizado. |
| `components/accuracy-widget.tsx` | UI | Server Component. Widget de acierto global en la home. |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `lib/agents/live-loader.ts` | Extraer `computePredictionsRetroactive(fixture, byId)` sin la guarda de `finished`. |
| `app/fixtures/[id]/page.tsx` | Si `finished`, usar `computePredictionsRetroactive` y renderizar `<ModelResultCard>`. |
| `app/page.tsx` | Calcular `AccuracyStats` y renderizar `<AccuracyWidget>` si `total >= 3`. |

## Cambio en `live-loader.ts`

```ts
// Función existente: solo para partidos no finalizados (sin cambio)
export function computePredictionsForFixture(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  if (fixture.status === 'finished') return []
  // ... misma lógica
}

// Nueva función: sin guarda de status
export function computePredictionsRetroactive(fixture: Fixture, byId: Map<number, Team>): ModelOutput[] {
  // misma lógica que computePredictionsForFixture pero sin el guard de finished
}
```

La función existente no cambia para no afectar el live loading. La nueva solo se
llama desde `app/fixtures/[id]/page.tsx` cuando `fixture.status === 'finished'`.

## Diseño visual de `ModelResultCard`

```
┌────────────────────────────────────────────────────┐
│  PREDICCIÓN DE LA IA  ·  ✓ ACERTÓ                │
│                                                    │
│  Local   ██████████░░░░░░  62%   ← top-1          │
│  Empate  ████░░░░░░░░░░░░  24%                    │
│  Visita  ██░░░░░░░░░░░░░░  14%                    │
│                                                    │
│  Resultado real: 2 - 1  (Local ganó)              │
└────────────────────────────────────────────────────┘
```

- Barra top-1 en acento dorado `#FFDB00`.
- Las otras barras en `rgba(255,255,255,0.15)`.
- Veredicto ✓ en verde `#22c55e` / ✗ en rojo `#ef4444`.
- Si veredicto es `✗`, mostrar qué outcome era el correcto.

## Diseño visual de `AccuracyWidget` (home)

```
┌────────────────────────────────────────────────────┐
│  PRECISIÓN DEL MODELO                             │
│                                                    │
│  14 / 20 partidos                  70%            │
│  ████████████████░░░░░░░░          ↑ barra        │
│                                                    │
│  Resultado 1X2 · Solo partidos finalizados        │
└────────────────────────────────────────────────────┘
```

- Barra de progreso en `#FFDB00` sobre fondo `rgba(255,255,255,0.05)`.
- El porcentaje va en número grande a la derecha (misma jerarquía visual que la
  home usa para probabilidades).
- Si total < 3: no renderizar el widget.

## Posición en la home

`<AccuracyWidget>` va debajo de `<Candidates>` (proyecciones del torneo) y antes de
cualquier sección de fixtures, como cierre de la sección de análisis global.

## Tests mínimos en Vitest

```ts
describe('accuracy skills', () => {
  it('deriveActualOutcome: home win', () => expect(deriveActualOutcome(2, 0)).toBe('home'))
  it('deriveActualOutcome: draw', () => expect(deriveActualOutcome(1, 1)).toBe('draw'))
  it('deriveActualOutcome: away win', () => expect(deriveActualOutcome(0, 1)).toBe('away'))
  it('resolveModelVerdict: correct when top-1 matches actual', () => {
    const probs = { home: 0.6, draw: 0.25, away: 0.15 }
    expect(resolveModelVerdict(probs, 2, 0)).toBe('correct')
  })
  it('resolveModelVerdict: incorrect when top-1 does not match actual', () => {
    const probs = { home: 0.6, draw: 0.25, away: 0.15 }
    expect(resolveModelVerdict(probs, 0, 1)).toBe('incorrect')
  })
})
```
