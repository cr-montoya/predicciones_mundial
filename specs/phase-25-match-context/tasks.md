# phase-25-match-context — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [x] 1. `spec-review`.
- [x] 2. Analyst: validar que mostrar contexto H2H no implica cambio en el modelo.
- [x] 3. `data-contract`: formalizar `H2HMatch` y endpoint de football-data.org a usar.
- [x] 4. Design: aprobar diseño de forma y H2H.
- [x] 5. Grill: verificar disponibilidad del endpoint H2H en el plan actual de la API.

### Implementación
- [x] 6. Extraer `WdlBadge` a `components/wdl-badge.tsx` (shared); actualizar team-fixtures.tsx.
- [x] 7. Crear `lib/agents/h2h-loader.ts` con timeout y fallback vacío.
- [x] 8. Crear `components/form-strip.tsx`.
- [x] 9. Crear `components/match-context.tsx`.
- [x] 10. Integrar `<MatchContext>` en `app/fixtures/[id]/page.tsx`.

### Verificación
- [x] 11. `pnpm tsc --noEmit` — PASS.
- [x] 12. `pnpm test` — 361/361 PASS.
- [x] 13. `pnpm build` — PASS.
- [x] 14. QA manual: h2h catch all errors → `[]`, filtros FINISHED+null guard+opponent, posición MatchContext.
- [x] 15. Code Quality — PASS (sin blockers).
- [x] 16. Reviewer — PASS (harness compliant).

### Cierre
- [x] 17. `spec-closeout` — in_review, PR pendiente.
- [ ] 18. PR aprobado y preview revisado por owner.
- [ ] 19. Marcar `completed` post-merge.

## Definition of Done

- [ ] Forma reciente visible cuando hay partidos jugados.
- [ ] H2H visible si hay datos; omitido silenciosamente si falla.
- [ ] Sin degradación de performance (timeout H2H ≤ 2s).
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] Preview de Vercel revisado.
