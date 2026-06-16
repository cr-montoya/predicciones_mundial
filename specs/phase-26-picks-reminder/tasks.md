# phase-26-picks-reminder — Tasks

## Status

pending

## Tasks

### Pre-implementación
- [ ] 1. `spec-review`.
- [ ] 2. Design: aprobar diseño del banner y badge.
- [ ] 3. Confirmar que phase-19 está implementado.

### Implementación
- [ ] 4. Crear `components/picks-reminder-banner.tsx`.
- [ ] 5. Crear `components/fixtures-nav-badge.tsx`.
- [ ] 6. Integrar banner en `app/page.tsx` pasando fixtures como prop.
- [ ] 7. Integrar badge en `app/layout.tsx`.

### Verificación
- [ ] 8. `pnpm tsc --noEmit`.
- [ ] 9. QA: banner visible cuando hay partidos próximos sin pick.
- [ ] 10. QA: dismiss persiste hasta el día siguiente.
- [ ] 11. QA: sin hydration mismatch en SSR.
- [ ] 12. Code Quality y Reviewer.

### Cierre
- [ ] 13. `spec-closeout` y PR.

## Definition of Done

- [ ] Banner aparece correctamente y se puede cerrar.
- [ ] Badge en nav muestra conteo correcto.
- [ ] Sin flash de contenido en SSR.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] Preview de Vercel revisado.
