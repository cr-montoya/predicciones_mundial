---
status: completed
phase: 20
owner: cristian
branch: phase/20-accuracy
pr:
preview:
gates:
  spec_review: approved
  grill: approved
  analyst: approved
  design: approved
  data_contract: approved
  security: not_applicable
  qa: approved
  code_quality: approved
  reviewer: approved
---

# phase-20-accuracy — Requirements

## Status

pending

## Objective

Mostrar las predicciones del modelo retroactivamente en partidos finalizados y
calcular un porcentaje de acierto global del modelo, para que la app pueda
responder: "¿qué tan bien predice la IA el Mundial?".

## Contexto

Actualmente `computePredictionsForFixture` tiene una guarda `if (fixture.status ===
'finished') return []`, por lo que los partidos finalizados muestran solo "Sin
predicciones para este partido". El modelo es determinista y solo usa datos
estáticos (fuerzas de equipo, histórico de goles). Puede ejecutarse en cualquier
momento — antes o después del partido — y producir las mismas probabilidades.

Eso significa que para cualquier partido finalizado podemos:

1. Correr el modelo retroactivamente para obtener las probabilidades pre-partido.
2. Comparar la predicción top-1 del modelo (`result_1x2`) con el resultado real
   (`homeGoals` vs `awayGoals`).
3. Agregar los veredictos de todos los partidos finalizados para obtener un
   porcentaje de acierto global.

## Scope

### 1. Predicciones retroactivas en partidos finalizados

En `app/fixtures/[id]/page.tsx`, cuando `fixture.status === 'finished'`:

- Calcular predicciones retroactivas (nueva función que no tiene la guarda).
- Mostrar el marcador final (ya existe).
- Mostrar las probabilidades del modelo para `result_1x2` tal como se habrían
  proyectado antes del partido.
- Mostrar el veredicto del modelo: si la predicción top-1 coincidió con el resultado
  real o no.

### 2. Widget de acierto global en la home

En `app/page.tsx`, agregar un widget con:

- Partidos finalizados analizados.
- Cuántos el modelo acertó (top-1 de `result_1x2` == resultado real).
- Porcentaje de acierto.
- Barra de progreso visual.

## Out of Scope

- Acierto de otros mercados (goles, corners, tarjetas). Solo `result_1x2` en esta
  fase.
- Tracking histórico por fecha o por grupo (fase futura).
- Score probabilístico (Brier score, log-loss). Solo acierto binario top-1 para
  MVP.
- Picks del usuario (spec phase-19, independiente).

## Modelo de datos

### Skill: `resolveModelCall`

```ts
export type MatchOutcome = 'home' | 'draw' | 'away'

/** Determina el outcome real a partir del marcador final. */
export function deriveActualOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return 'home'
  if (awayGoals > homeGoals) return 'away'
  return 'draw'
}

/**
 * Dada la distribución de result_1x2 del modelo, retorna el outcome top-1
 * (la "apuesta" del modelo).
 */
export function topModelCall(probabilities: Record<string, number>): MatchOutcome | null {
  const sorted = Object.entries(probabilities).sort(([, a], [, b]) => b - a)
  const top = sorted[0]?.[0]
  if (top === 'home' || top === 'draw' || top === 'away') return top
  return null
}

/** Veredicto del modelo: acertó o no. */
export function resolveModelVerdict(
  probabilities: Record<string, number>,
  homeGoals: number,
  awayGoals: number,
): 'correct' | 'incorrect' | null {
  const call = topModelCall(probabilities)
  if (!call) return null
  return call === deriveActualOutcome(homeGoals, awayGoals) ? 'correct' : 'incorrect'
}
```

### Skill: `computeAccuracyStats`

```ts
export interface MatchAccuracyRecord {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  modelCall: MatchOutcome
  actual: MatchOutcome
  correct: boolean
  homeProb: number
  drawProb: number
  awayProb: number
}

export interface AccuracyStats {
  total: number
  correct: number
  pct: number  // 0-100
  records: MatchAccuracyRecord[]
}
```

Esta skill recibe una lista de registros ya procesados (fixture + predicción) y
calcula los totales. Es pura — sin red, sin storage.

## Requirements

1. La página de fixture finalizado muestra las probabilidades pre-partido del modelo
   para `result_1x2` (home / draw / away).
2. La página de fixture finalizado muestra el veredicto del modelo (acertó / falló)
   junto al marcador final.
3. El widget de home muestra: partidos analizados, aciertos y porcentaje.
4. Los skills `resolveModelVerdict` y `computeAccuracyStats` son funciones puras
   con cobertura de tests.
5. El resto de la página de fixture finalizado (marcador, fecha, equipos) no cambia.
6. El guard `if (fixture.status === 'finished') return []` se mueve o se crea una
   función alternativa; no se elimina el tipo `finished` como concepto.

## Acceptance Criteria

- [ ] Fixture finalizado: muestra probabilidades retroactivas de `result_1x2`.
- [ ] Fixture finalizado: veredicto del modelo visible (✓ acertó / ✗ falló) con el
      resultado real como referencia.
- [ ] Home: widget de acierto global con total, aciertos y porcentaje.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm test` pasa (skills cubiertas: `deriveActualOutcome`, `topModelCall`,
      `resolveModelVerdict`).

## Risks and Assumptions

- El modelo es determinista desde datos estáticos, por lo que recomputar para
  partidos finalizados produce las mismas probabilidades que habría producido antes
  del partido. Si en fases futuras el modelo incorpora datos en tiempo real (lineups,
  injuries), esta propiedad dejaría de cumplirse y habría que almacenar las
  predicciones pre-partido antes de que comience.
- El porcentaje de acierto al inicio del torneo (primeros partidos) puede ser
  estadísticamente poco representativo. El widget solo se muestra si hay al menos
  3 partidos finalizados.
- El cómputo de precisión en la home se hace en el server component de forma síncrona
  (no requiere nueva llamada de red, solo iterar los fixtures ya cargados y aplicar
  el modelo). Si el número de partidos hace esto muy costoso, se puede mover a un
  JSON precomputado.
