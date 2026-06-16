# fix-goleadores-empty-state — Tasks

## Status

active

## Tasks

- [x] 1. Agregar guarda `scorerMarkets.length > 0` y filtro de `probabilities` vacío en `app/fixtures/[id]/page.tsx`.
- [x] 2. Crear `lib/data/squads.ts` con los top goleadores de los 32 equipos (goalsScored, minutesPlayed, goalsPerMinute).
- [x] 3. Actualizar `lib/agents/live-loader.ts` para inyectar `homePlayers` y `awayPlayers` desde `squads.ts`.
- [x] 4. Fix `translateOutcome` en `markets-es.ts` para renderizar solo el nombre sin el prefijo de ID.
- [x] 5. Correr `pnpm tsc --noEmit` y `pnpm test`.
- [x] 6. Verificar en local que la sección GOLEADORES muestra jugadores con probabilidades.
- [ ] 7. Verificar en preview de Vercel.

## Definition of Done

- [ ] Sección GOLEADORES muestra jugadores reales con probabilidades en todos los partidos no finalizados.
- [ ] Badge "DATOS LIMITADOS" sigue presente.
- [ ] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [ ] `pnpm spec:check` pasa.
- [ ] `specs/README.md` actualizado.
- [ ] Preview de Vercel confirmado por owner.
