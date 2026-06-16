# phase-24-team-page — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`.
- [ ] 2. `data-contract`: confirmar interfaz de squad top y cómo se filtran los jugadores.
- [ ] 3. Design: aprobar layout de la página y las barras de rating.
- [ ] 4. Grill.

### Implementación
- [ ] 5. Crear `app/teams/[id]/page.tsx` con `notFound()` para IDs inválidos.
- [ ] 6. Crear `components/model-rating-bars.tsx`.
- [ ] 7. Crear `components/team-fixtures.tsx`.
- [ ] 8. Crear `components/squad-top.tsx`.
- [ ] 9. Agregar links a `/teams/[id]` en headers de fixture y tabla de grupos.

### Verificación
- [ ] 10. `pnpm tsc --noEmit` y `pnpm build`.
- [ ] 11. QA: probar con equipos con y sin datos de squad.
- [ ] 12. QA: link inválido (`/teams/9999`) hace notFound.
- [ ] 13. Code Quality y Reviewer.

### Cierre
- [ ] 14. `spec-closeout` y PR.

## Definition of Done

- [ ] `/teams/[id]` renderiza para todos los equipos del torneo.
- [ ] Rating, fixtures y squad top visibles.
- [ ] Links desde fixture y grupos funcionan.
- [ ] `pnpm build` pasa.
- [ ] Preview de Vercel revisado.
