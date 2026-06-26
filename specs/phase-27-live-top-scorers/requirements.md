---
status: completed
phase: 27
owner: cristian
branch: phase/27-live-top-scorers
pr: "20"
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: passed
  design: passed
  data_contract: passed
  security: passed
  qa: passed
  code_quality: passed
  reviewer: passed
---

# Live Top Scorers — Requirements

## Status

completed

## Objective

Mostrar en la sección "Candidatos a Bota de Oro" los goles reales actuales del torneo
junto a la probabilidad predicha por el modelo, y mantener la lista de candidatos
sincronizada con los goleadores reales del Mundial 2026. Hoy el JSON precomputado
nunca se actualiza en runtime, por lo que jugadores con goles reales (ej. Messi con 5
goles) no aparecen o aparecen con datos desactualizados.

## Scope

- Fetch en runtime (ISR) de los goleadores actuales del Mundial 2026 desde
  `football-data.org /v4/competitions/WC/scorers`.
- Mostrar goles reales actuales junto a la probabilidad % del modelo para cada
  candidato visible.
- Combinar candidatos del JSON precomputado (por probabilidad) con los líderes reales
  del torneo (por goles), priorizando a jugadores con goles reales cuando hay conflicto.
- Actualizar `squads.json` y re-correr el Monte Carlo (`pnpm precompute`) como parte del
  despliegue o de un proceso manual documentado, para reflejar goles reales en las
  probabilidades.
- Fallback: si el fetch de scorers falla, mostrar candidatos del JSON precomputado sin
  columna de goles.

## Out of Scope

- Cron job automático en Vercel para disparar `pnpm precompute` (puede ser fase futura).
- Mostrar asistencias o estadísticas adicionales.
- Re-correr el Monte Carlo en tiempo de request (demasiado costoso para ISR).
- Cambiar el modelo matemático de distribución de goles.

## Requirements

1. El agente `live-loader` (o un agente nuevo `scorers-loader`) debe obtener los
   goleadores reales del torneo en runtime con caché ISR de 3600 s.
2. El fetch debe usar `FOOTBALLDATA_KEY` server-side; nunca exponer la key al cliente.
3. La respuesta debe normalizarse en un tipo `LiveScorer` con campos:
   `playerId`, `playerName`, `teamId`, `goals`, `assists`.
4. La lista de candidatos visible debe fusionar:
   a. Los candidatos del JSON precomputado (ordenados por probabilidad).
   b. Los goleadores reales del torneo ordenados por goles actuales.
   La fusión prioriza mostrar a los líderes reales incluso si tienen probabilidad
   predicha baja o nula en el JSON.
5. Cada fila de candidato debe mostrar el conteo de goles reales actual (o `—` si no
   tiene goles registrados) y la probabilidad del modelo.
6. Si el endpoint falla o devuelve lista vacía, la UI muestra la lista de candidatos del
   JSON precomputado sin columna de goles (degradación sin error visible).
7. El precompute script debe documentarse como paso periódico durante el torneo para
   mantener las probabilidades sincronizadas con los goles reales.
8. `pnpm tsc --noEmit`, `pnpm test` y `pnpm build` deben pasar sin errores.

## Acceptance Criteria

- [ ] La sección Candidatos a Bota de Oro muestra goles reales actuales para cada jugador.
- [ ] Jugadores con goles reales (ej. Messi) aparecen aunque no estén en el top de
      probabilidades precomputadas.
- [ ] La columna de goles muestra `—` para candidatos sin goles registrados en el torneo.
- [ ] Si `football-data.org` falla, la sección sigue mostrando candidatos (sin goles).
- [ ] La API key no es visible en el bundle del cliente.
- [ ] TypeScript compila sin errores.
- [ ] Tests pasan.
- [ ] Build de producción pasa.
- [ ] Preview de Vercel revisado y sección visible correctamente.

## Risks and Assumptions

- `football-data.org /v4/competitions/WC/scorers` puede estar disponible con el tier
  gratuito/básico; verificar límite de requests y plan activo.
- El torneo puede estar en fase de grupos, octavos, cuartos, etc.; el endpoint debe
  devolver scorers acumulados del torneo completo, no solo la última fase.
- La normalización de nombres entre la API y `squads.json` puede tener inconsistencias
  (acentos, apellidos compuestos); usar el mismo algoritmo que ya usa `mergeWCScorers()`.
- Si el JSON precomputado está muy desactualizado, las probabilidades pueden no reflejar
  la realidad actual; documentar cuándo fue el último precompute en la UI (campo
  `computedAt` del JSON).
- El candidato con más goles reales puede no estar entre los top por probabilidad; la
  fusión debe ser explícita para evitar listas confusas.
