---
status: pending
phase:
owner: cristian
branch:
pr:
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: pending
  data_contract: not_applicable
  security: not_applicable
  qa: pending
  code_quality: not_applicable
  reviewer: pending
---

# fix-goleadores-empty-state — Requirements

## Status

pending

## Objective

Eliminar el estado visual roto de la sección GOLEADORES cuando no hay jugadores elegibles:
actualmente muestra "DATOS LIMITADOS" con headers de mercado pero sin ninguna barra de
probabilidad, lo que parece un error de carga.

## Contexto

El modelo de goleadores (`lib/model/scorers.ts`) retorna `emptyOutput` con `probabilities: {}`
cuando no hay jugadores elegibles (el caso frecuente, ya que `computePredictionsForFixture`
pasa `homePlayers: []` y `awayPlayers: []`). La UI muestra la sección colapsada con count=2
y al expandir muestra los headers de mercado ("Goleador" / "1er goleador") vacíos.

## Scope

- Ocultar la sección GOLEADORES en la fixture detail page cuando `probabilities` está vacío
  en ambos mercados de goleadores.
- El comportamiento actual con datos reales de jugadores (si los hay) se preserva.

## Out of Scope

- Integrar API-Football para obtener lineups reales (eso es fase 18).
- Cambiar el modelo matemático de goleadores.
- Modificar la bota de oro del torneo (mercado separado, funciona correctamente).

## Requirements

1. Si `anytime_scorer.probabilities` y `first_scorer.probabilities` están vacíos,
   no renderizar la sección GOLEADORES en `/fixtures/[id]`.
2. Si al menos uno tiene jugadores, mostrar la sección normalmente (con "DATOS LIMITADOS"
   cuando aplique).
3. El comportamiento no debe afectar otros mercados ni la sección de bota de oro.

## Acceptance Criteria

- [ ] En `/fixtures/[id]` de un partido sin lineup, la sección GOLEADORES no aparece.
- [ ] En un partido con jugadores (si existe), la sección GOLEADORES sigue mostrándose.
- [ ] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [ ] Preview de Vercel confirma que la sección desaparece en partidos sin datos.

## Risks and Assumptions

- La condición de "vacío" se puede detectar con `Object.keys(probabilities).length === 0`.
- Cuando fase 18 integre lineups reales, la sección volverá a aparecer automáticamente
  sin más cambios en esta lógica.
