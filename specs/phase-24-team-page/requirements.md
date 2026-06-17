---
status: completed
phase: 24
owner: cristian
branch: phase/24-team-page
pr: 16
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: not_applicable
  design: pending
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-24-team-page — Requirements

## Status

completed

## Objective

Página dedicada por equipo (`/teams/[id]`) con squad, grupo, partidos del torneo
y rating del modelo. Da profundidad de contenido a la app y un destino natural
cuando el usuario quiere saber más de una selección específica.

## Contexto

La app tiene la tabla de grupos (`/groups`) y la lista de fixtures (`/fixtures`),
pero no hay una página centrada en un equipo concreto. Los datos ya existen:
- Squad: `lib/data/squads.json` (generado por `pnpm precompute:squads`).
- Partidos: `loadFixtures()` filtrado por `homeTeamId` o `awayTeamId`.
- Rating del modelo: `Team.attackStrength` y `Team.defenseStrength` de
  `lib/agents/static-teams.ts`.
- Grupo y posición: de `buildStaticTeams()`.

## Scope

- Ruta `/teams/[id]` — Server Component con ISR (revalidate 3600).
- Secciones:
  1. **Header**: nombre, bandera, grupo.
  2. **Rating del modelo**: attackStrength y defenseStrength visualizados como
     barras relativas al promedio (1.0).
  3. **Partidos del torneo**: lista de fixtures donde juega el equipo, con
     resultado si ya se jugó o predicción si es scheduled.
  4. **Squad top**: los jugadores top del equipo según `goalsPerMinute` de
     `squads.json` (máx. 8 jugadores).
- Links desde la tabla de grupos y desde los headers de fixture.

## Out of Scope

- Estadísticas en tiempo real del torneo (goles marcados, tarjetas). Fase futura.
- Historial de resultados fuera del Mundial 2026.
- Comparación entre equipos (fase futura).
- Alineación táctica o formación.

## Requirements

1. `/teams/[id]` renderiza sin errores para cualquier equipo del torneo.
2. El header muestra nombre del equipo con bandera y grupo.
3. El rating del modelo es visible con alguna representación visual.
4. Los fixtures del equipo están listados en orden cronológico.
5. El squad top muestra al menos los 5 mejores atacantes/mediocampistas según
   el modelo.
6. Los headers de equipos en las páginas de fixture linkean a `/teams/[id]`.

## Acceptance Criteria

- [ ] `/teams/1` (United States) renderiza correctamente.
- [ ] Header con nombre, bandera y grupo visible.
- [ ] Rating de ataque y defensa visibles.
- [ ] Lista de partidos del equipo con resultados/predicciones.
- [ ] Squad top con jugadores y sus proyecciones.
- [ ] Links desde fixture headers funcionan.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm build` pasa.

## Risks and Assumptions

- `squads.json` puede tener jugadores sin posición definida o con `goalsPerMinute`
  muy bajo. El squad top debe filtrar por elegibilidad (misma lógica que el modelo).
- Los IDs de equipo en la URL deben coincidir con el ID canónico de `teams-seed.ts`,
  no con el ID de football-data.org.
- Si el equipo no existe, la ruta debe hacer `notFound()`.
