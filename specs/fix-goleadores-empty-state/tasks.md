# fix-goleadores-empty-state — Tasks

## Status

in_review

## Tasks

- [x] 1. Verificar en `app/fixtures/[id]/page.tsx` si el CollapsibleSection de GOLEADORES
        ya tiene guarda `scorerMarkets.length > 0`. Si no, agregarla.
- [x] 2. Filtrar `scorerMarkets` para excluir mercados con `probabilities` vacío.
- [x] 3. Correr `pnpm tsc --noEmit` y `pnpm test`.
- [ ] 4. Verificar en preview de Vercel que la sección desaparece en partidos sin lineup.

## Definition of Done

- [x] Sección GOLEADORES no aparece cuando no hay jugadores elegibles.
- [x] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [x] `pnpm spec:check` pasa.
- [x] `specs/README.md` actualizado.
- [ ] Preview de Vercel confirmado por owner.
