# fix-goleadores-empty-state — Tasks

## Status

pending

## Tasks

- [ ] 1. Verificar en `app/fixtures/[id]/page.tsx` si el CollapsibleSection de GOLEADORES
        ya tiene guarda `scorerMarkets.length > 0`. Si no, agregarla.
- [ ] 2. Filtrar `scorerMarkets` para excluir mercados con `probabilities` vacío.
- [ ] 3. Correr `pnpm tsc --noEmit` y `pnpm test`.
- [ ] 4. Verificar en preview de Vercel que la sección desaparece en partidos sin lineup.

## Definition of Done

- [ ] Sección GOLEADORES no aparece cuando no hay jugadores elegibles.
- [ ] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [ ] `pnpm spec:check` pasa.
- [ ] `specs/README.md` actualizado.
- [ ] Preview de Vercel confirmado por owner.
