# phase-26-picks-reminder — Tasks

## Status

in_review

## Tasks

### Pre-implementación
- [x] 1. `spec-review` — passed (decisión A: badge vía localStorage compartido).
- [x] 2. Design: aprobar diseño del banner y badge — passed.
- [x] 3. Confirmar que phase-19 está implementado — confirmado (pick_${id} en localStorage).

### Implementación
- [x] 4. Crear `components/picks-reminder-banner.tsx`.
- [x] 5. Crear `components/fixtures-nav-badge.tsx`.
- [x] 6. Integrar banner en `app/page.tsx` pasando fixtures como prop.
- [x] 7. Badge integrado en `components/nav.tsx` (no en layout.tsx — decisión A).
- [x] 8. Extraer `UPCOMING_UNPICKED_COUNT_KEY` como constante compartida (Code Quality fix).

### Verificación
- [x] 9. `pnpm tsc --noEmit` — PASS.
- [x] 10. `pnpm test` — 361/361 PASS.
- [x] 11. `pnpm build` — PASS.
- [x] 12. QA: SSR safe (count=0 inicial, useEffect monta en cliente) — PASS.
- [x] 13. QA: dismiss persiste date-scoped en localStorage — PASS.
- [x] 14. Code Quality — PASS (sin blockers).
- [x] 15. Reviewer — PASS (harness conforme).

### Cierre
- [x] 16. `spec-closeout` — in_review, PR pendiente.
- [ ] 17. PR aprobado y preview revisado por owner.
- [ ] 18. Marcar `completed` post-merge.

## Definition of Done

- [ ] Banner aparece correctamente y se puede cerrar.
- [ ] Badge en nav muestra conteo correcto.
- [ ] Sin flash de contenido en SSR.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] Preview de Vercel revisado.
