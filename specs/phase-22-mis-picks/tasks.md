# phase-22-mis-picks — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`.
- [ ] 2. `data-contract`: confirmar interfaz entre Server Component (fixtures) y Client Component (picks).
- [ ] 3. Design: aprobar wireframe de contador y filas de picks.
- [ ] 4. Confirmar que phase-19 está implementado (picks en localStorage).

### Implementación
- [ ] 5. Crear `app/mis-picks/page.tsx` (shell con loadFixtures).
- [ ] 6. Crear `components/mis-picks-client.tsx`.
- [ ] 7. Crear `components/pick-result-row.tsx`.
- [ ] 8. Agregar link a `/mis-picks` en nav o home.

### Verificación
- [ ] 9. `pnpm tsc --noEmit`.
- [ ] 10. QA: estado vacío, picks pendientes, picks resueltos correctos/incorrectos.
- [ ] 11. Code Quality y Reviewer.

### Cierre
- [ ] 12. `spec-closeout` y PR.

## Definition of Done

- [ ] `/mis-picks` renderiza correctamente con y sin picks.
- [ ] Contador de aciertos correcto.
- [ ] Estado vacío con CTA visible.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] Preview de Vercel revisado.
