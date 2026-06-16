# phase-19-picks — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`: validar que la spec está lista antes de implementar.
- [ ] 2. `data-contract`: formalizar contrato de `StoredPick` y skill `resolveVerdict`.
- [ ] 3. Design aprueba wireframes de `PickPanel` en sus tres estados.
- [ ] 4. Grill: detectar blockers antes de arrancar.

### Implementación
- [ ] 5. Crear `lib/skills/picks.ts` con `deriveOutcome` y `resolveVerdict`.
- [ ] 6. Escribir tests unitarios para `resolveVerdict` y `deriveOutcome` en Vitest.
- [ ] 7. Crear `components/pick-panel.tsx` (Client Component): botones 1X2, localStorage, veredicto.
- [ ] 8. Crear `components/pick-badge.tsx` (Client Component): badge en tarjetas de fixture list.
- [ ] 9. Integrar `<PickPanel>` en `app/fixtures/[id]/page.tsx`.
- [ ] 10. Integrar `<PickBadge>` en `app/fixtures/page.tsx`.

### Verificación
- [ ] 11. `pnpm tsc --noEmit`.
- [ ] 12. `pnpm test`.
- [ ] 13. QA: validar los 5 estados de PickPanel (scheduled sin pick, scheduled con pick, live, finished correcto, finished incorrecto).
- [ ] 14. Code Quality sin bloqueantes.
- [ ] 15. Reviewer sin bloqueantes.
- [ ] 16. Grill re-check.

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
