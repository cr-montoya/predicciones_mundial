# phase-19-picks — Tasks

## Status

in_review

## Tasks

### Pre-implementación
- [x] 1. `spec-review`: validar que la spec está lista antes de implementar.
- [x] 2. `data-contract`: formalizar contrato de `StoredPick` y skill `resolveVerdict`.
- [x] 3. Design aprueba wireframes de `PickPanel` en sus tres estados.
- [x] 4. Grill: detectar blockers antes de arrancar.

### Implementación
- [x] 5. Crear `lib/skills/picks.ts` con `deriveOutcome` y `resolveVerdict`.
- [x] 6. Escribir tests unitarios para `resolveVerdict` y `deriveOutcome` en Vitest.
- [x] 7. Crear `components/pick-panel.tsx` (Client Component): botones 1X2, localStorage, veredicto.
- [x] 8. Crear `components/pick-badge.tsx` (Client Component): badge en tarjetas de fixture list.
- [x] 9. Integrar `<PickPanel>` en `app/fixtures/[id]/page.tsx`.
- [x] 10. Integrar `<PickBadge>` en `app/fixtures/page.tsx`.

### Verificación
- [x] 11. `pnpm tsc --noEmit`.
- [x] 12. `pnpm test`.
- [x] 13. QA: validar los 5 estados de PickPanel (scheduled sin pick, scheduled con pick, live, finished correcto, finished incorrecto).
- [x] 14. Code Quality sin bloqueantes.
- [x] 15. Reviewer sin bloqueantes.
- [x] 16. Grill re-check.

### Cierre
- [ ] 17. `spec-closeout`.
- [ ] 18. PR hacia `main`.

## Definition of Done

- [ ] Pick funciona end-to-end: se guarda, bloquea y verifica correctamente.
- [ ] Los 5 estados del PickPanel son correctos visualmente.
- [ ] Badge en lista de fixtures visible.
- [ ] `pnpm tsc --noEmit` y `pnpm test` pasan.
- [ ] `pnpm spec:check` pasa.
- [ ] `specs/README.md` actualizado.
- [ ] Preview de Vercel revisado.
