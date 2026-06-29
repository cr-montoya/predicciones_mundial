# Fix Bracket Confirmed Matchups — Tasks

## Status

in_review

## Tasks

### Paso 0 — Diagnóstico (antes de implementar)

- [x] 0.1 Ejecutar `pnpm refresh-fixtures` → 88 fixtures válidos (de 104 total), `generatedAt: 2026-06-29T05:21:32Z`.
- [x] 0.2 16 fixtures de LAST_32 confirmados con equipos reales. Fix de código necesario — el bug era código + cache stale.
- [x] 0.3 Verificado: Colombia (20) vs Ghana (135) en el API. Bug era que el código ignoraba datos del API y proyectaba con standings de cache stale del 14 de junio.

### Paso 1 — Actualizar fixtures-cache.json

- [x] 1.1 `pnpm refresh-fixtures` exitoso. 88 fixtures escritos a `lib/data/fixtures-cache.json`.
- [x] 1.2 count=88 > 72, generatedAt=2026-06-29T05:21:32Z.

### Paso 2 — Fix en app/bracket/page.tsx

- [x] 2.1 Construido `r32ByTeam: Map<number, Fixture>` indexado por teamId usando `normalizeKnockoutStage`.
- [x] 2.2 Para cada def: proyecta con `resolveSlot`, busca fixture confirmado via equipo proyectado, usa el fixture del API si existe.
- [x] 2.3 `confirmedScore` pasado a `ResolvedMatchup` cuando `status === 'finished' | 'live'`.
- [x] 2.4 `isProjected: false` cuando el equipo viene del fixture del API.
- [x] 2.5 Eliminado `confirmedKnockout` y `confirmedTeams` (dead code). Reemplazado por `r32ByTeam`.
- [x] Bonus: `positionLabel` asignado por teamId (no por posición en el def) para evitar swap cuando el API invierte home/away vs. el def.

### Paso 3 — Verificación

- [x] 3.1 `pnpm tsc --noEmit` → OK.
- [x] 3.2 `pnpm test` → 384/384 passed.
- [x] 3.3 `pnpm build` → OK, `/bracket` static ISR.
- [x] 3.4 `pnpm spec:check` → errores pre-existentes en specs antiguas, ninguno de este fix.
- [ ] 3.5 Verificar `/bracket` en Vercel preview (Colombia vs Ghana visible en M83).
- [ ] 3.6 Verificar los demás 15 partidos de R32 en el preview.

### Paso 4 — Cierre

- [ ] 4.1 Ejecutar gates QA, Code Quality, Reviewer.
- [ ] 4.2 Ejecutar `spec-closeout`.
- [ ] 4.3 Preparar PR con `pr-prep`.
- [ ] 4.4 Revisar preview de Vercel.

## Definition of Done

- [ ] Los requirements del spec están satisfechos.
- [ ] El bracket muestra Colombia vs Ghana (no Ecuador) y los demás emparejamientos confirmados son correctos.
- [ ] No hay código muerto (`confirmedTeams` sin usar).
- [ ] El fallback a standings sigue funcionando cuando el API no tiene el equipo confirmado.
- [ ] Gates QA, Code Quality, Reviewer ejecutados o documentados como no aplicables.
- [ ] `pnpm spec:check` pasa.
- [ ] `specs/README.md` actualizado.
- [ ] PR template referencia este spec.
