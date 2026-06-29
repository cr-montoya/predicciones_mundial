---
status: in_review
phase:
owner: cristian
branch: fix/bracket-confirmed-matchups
pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: not_applicable
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Fix Bracket Confirmed Matchups — Requirements

## Status

in_review

## Objective

El bracket de eliminatorias muestra emparejamientos proyectados desde standings del grupo incluso cuando el API ya devuelve los partidos reales de eliminatoria con equipos confirmados. Ejemplo concreto: la app muestra Colombia vs Ecuador cuando el torneo ya tiene confirmado Colombia vs Ghana. Este fix prioriza los datos confirmados del API sobre las proyecciones computadas.

## Context

La fase de grupos del Mundial 2026 terminó el 26 de junio de 2026. El API de football-data.org ahora devuelve los 16 partidos de la Ronda de 32 con equipos confirmados (homeTeamId y awayTeamId no-nulos). Sin embargo:

1. **Bug de código** (`app/bracket/page.tsx` líneas 54–66): Se construye un mapa `confirmedTeams` a partir de los fixtures de eliminatoria del API, pero **nunca se usa**. La función `resolveSlot` siempre recomputa desde standings del grupo, ignorando los equipos reales.
2. **Cache stale** (`lib/data/fixtures-cache.json`): Generada el 14 de junio con solo 72 fixtures (fase de grupos parcial). No contiene resultados completos de grupo ni partidos de eliminatoria.

## Scope

- Actualizar `app/bracket/page.tsx` para usar equipos confirmados del API cuando el fixture de eliminatoria ya los tiene (homeTeamId y awayTeamId no-nulos).
- Actualizar `lib/data/fixtures-cache.json` ejecutando `pnpm refresh-fixtures` para tener todos los resultados del grupo y los 16 fixtures de Ronda de 32 confirmados.
- La lógica de fallback cuando el API no tiene el equipo confirmado (`resolveSlot` desde standings) debe preservarse.

## Out of Scope

- Cambios al modelo estadístico o probabilidades.
- Cambios visuales al componente bracket.
- Rondas posteriores a la Ronda de 32 (Ronda de 16, cuartos, semi, final): esas aún no están confirmadas.
- Rediseño de la arquitectura de caching de fixtures.

## Requirements

1. Cuando el API devuelve un fixture de eliminatoria con `homeTeamId` y `awayTeamId` no-nulos, el bracket debe mostrar esos equipos reales, no proyecciones de standings.
2. Cuando el API devuelve un fixture de eliminatoria con `homeTeamId` o `awayTeamId` nulos (TBD), el bracket debe mostrar la proyección calculada desde standings como fallback.
3. La función `resolveSlot` debe mantenerse y seguir siendo utilizada como fallback.
4. El mapeo entre `matchId` del ROUND_OF_32_DEFS (`M73`–`M88`) y los IDs reales de fixture del API debe ser correcto y explícito.
5. `fixtures-cache.json` debe reflejar todos los resultados de la fase de grupos y los 16 fixtures de eliminatoria confirmados.
6. El build de producción no debe romperse (pnpm build).
7. TypeScript sin errores (pnpm tsc --noEmit).

## Acceptance Criteria

- [ ] El bracket muestra Colombia vs Ghana (no Colombia vs Ecuador) para el partido M83.
- [ ] Los demás partidos de Ronda de 32 muestran los equipos reales del API cuando están confirmados.
- [ ] Para cualquier fixture de eliminatoria donde el API no tenga equipo confirmado, sigue mostrando la proyección del standings (label "Por definir").
- [ ] `pnpm tsc --noEmit` pasa sin errores.
- [ ] `pnpm build` pasa.
- [ ] `pnpm test` pasa.
- [ ] El preview de Vercel muestra el bracket correcto.

## Risks and Assumptions

- **Asunción**: El API de football-data.org ya expone los 16 fixtures de la Ronda de 32 con equipos confirmados. Si no es así, el fix de código es irrelevante hasta que el API los publique.
- **Riesgo**: El mapeo entre `matchId` del bracket (`M73`–`M88`) y los IDs reales del fixture del API puede no existir explícitamente; hay que resolverlo por equipos (homeTeamId / awayTeamId) o por ronda/orden.
- **Riesgo**: La cache de fixtures puede no tener aún los fixtures de eliminatoria si `refresh-fixtures` falla o el API los devuelve con retraso.
- **Asunción**: La lógica de `computeGroupStandings` es correcta; los errores son solo de datos stale o de no priorizar fixtures confirmados.
