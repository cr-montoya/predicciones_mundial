---
status: completed
phase:
owner: cristian
branch: fix/goleadores-empty-state
pr: "10"
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: passed
  data_contract: not_applicable
  security: not_applicable
  qa: passed
  code_quality: not_applicable
  reviewer: passed
---

# fix-goleadores-empty-state — Requirements

## Status

completed

## Objective

Mostrar proyecciones reales de goleadores en la sección GOLEADORES de cada partido,
alimentando el modelo con datos históricos estáticos de los 32 equipos del Mundial 2026.

## Contexto

`computePredictionsForFixture` en `lib/agents/live-loader.ts` siempre pasa
`homePlayers: []` y `awayPlayers: []`. El modelo de scorers detecta que no hay
jugadores elegibles y retorna `probabilities: {}`, por lo que la sección GOLEADORES
aparece vacía (o se oculta con la guarda defensiva).

La solución correcta es proveer datos reales al modelo, siguiendo el mismo patrón de
`lib/data/tournament-prediction.json`: datos precomputados/estáticos que sirven de
fuente de verdad hasta que llegue la integración con lineups reales (fase 18).

## Scope

- Crear `lib/data/squads.ts` con los top goleadores de cada uno de los 32 equipos,
  con sus tasas históricas de goles/minuto (stats de WC 2022, qualifiers 2026 y
  selecciones recientes).
- Actualizar `computePredictionsForFixture` para inyectar los jugadores del equipo
  local y visitante desde ese archivo estático.
- Mantener la guarda `scorerMarkets.length > 0` en el UI como red de seguridad para
  equipos sin datos (por ejemplo, si se agrega un equipo nuevo no cubierto).

## Out of Scope

- Integrar API-Football para lineups reales (fase 18).
- Cambiar el modelo matemático de goleadores.
- Agregar nuevos mercados de goleadores.

## Requirements

1. `lib/data/squads.ts` contiene datos para los 32 equipos del Mundial 2026.
2. Cada equipo tiene al menos 4 jugadores elegibles (`minutesPlayed >= 90`, `goalsPerMinute > 0`).
3. `computePredictionsForFixture` inyecta `homePlayers` y `awayPlayers` desde `squads.ts`.
4. La sección GOLEADORES muestra jugadores con nombres y probabilidades reales.
5. El badge "DATOS LIMITADOS" se mantiene (la proyección es histórica, no lineup confirmado).
6. La guarda `scorerMarkets.length > 0` permanece como red de seguridad.

## Acceptance Criteria

- [ ] Sección GOLEADORES muestra jugadores con nombres y barras de probabilidad.
- [ ] El badge "DATOS LIMITADOS" sigue apareciendo.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm test` pasa.
- [ ] Preview de Vercel muestra la sección con datos en cualquier partido no finalizado.

## Risks and Assumptions

- Los datos son aproximados (stats históricas, no lineup del día). El badge "DATOS LIMITADOS"
  comunica esto correctamente.
- Cuando fase 18 integre lineups reales, solo se reemplaza el origen de los datos en
  `computePredictionsForFixture` — el modelo y la UI no cambian.
- Si un equipo no está en `squads.ts`, la guarda en page.tsx oculta la sección
  silenciosamente en lugar de mostrar un estado roto.
