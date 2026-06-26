# Live Top Scorers — Tasks

## Status

in_review

## Tasks

### Pre-implementación

- [x] 1. **Spec Review** — PASSED. Bloqueante de runtime-import resuelto antes de implementar.
- [x] 2. **Data Contract** — PASSED. Shape confirmado: `{ scorers: [{ player: { id, name }, team: { id }, goals, assists }] }`. playerId y assists defaultean a 0 si ausentes.
- [x] 3. **Grill** — CLEAR TO IMPLEMENT. Sin blockers.
- [x] 4. **Analyst** — PASSED. Sort two-tier aprobado; match por name+teamId con fallback a solo-nombre cuando teamId null; `—` para probability null; "Probabilidades calculadas" como label.
- [x] 5. **Design** — VISUALLY APPROVED. Columna verde `#02B906` para goles, `w-64 text-right tabular-nums`, `1 gol`/`5 goles` singular/plural, label de fecha bajo título.

### Implementación

- [x] 6. **Extraer `FD_TEAM_MAP` a `lib/data/fd-team-map.ts`**: extrae `FD_TEAM_MAP`, `toCanonicalTeamId`, y `FD_BASE_URL`. Ambos providers y scripts importan desde aquí.
- [x] 7. **Skill — `lib/skills/normalize-scorer-name.ts`**: creada con `normalizeName` (regex `̀-ͯ`), `LiveScorer`, `CandidateRow`, `mergeScorersWithCandidates`. Match estricto por teamId+nombre; fallback a solo-nombre cuando teamId null. Script importa `normalizeName` y `toCanonicalTeamId` desde los nuevos módulos.
- [x] 8. **Agent — `fetchLiveScorers()` + `buildInitialCandidates()`**: en `lib/agents/live-loader.ts`. Usa `apiFetch` con ISR 3600s, filtra `s.team?.id` para evitar teamId 0. Fallback a `[]` en error o sin key.
- [x] 9. **`HomeData`**: extendido con `candidates: CandidateRow[]` y `goldenBootComputedAt: string` en `home-types.ts`. `loadHomeData` corre fixtures y scorers en paralelo con `Promise.all`.
- [x] 10. **`app/page.tsx`**: pasa `candidates` y `goldenBootComputedAt` a `<Candidates>`.
- [x] 11. **`components/candidates.tsx`**: nuevo `BootList` con props `candidates/computedAt`; columna de goles en verde `#02B906`; `1 gol`/`5 goles`; label "Probabilidades calculadas: DD/MM/YYYY"; `WinnerList` separado mantiene barras. `getFlag` eliminado del boot.

### Post-implementación

- [x] 12. **QA** — 23 tests nuevos en `lib/skills/__tests__/normalize-scorer-name.test.ts`. Todos pasan. Cubre normalizeName, merge logic, sort order, fallback, collisions.
- [x] 13. **`pnpm tsc --noEmit`** — PASSED.
- [x] 14. **`pnpm test`** — PASSED. 384/384 tests (24 test files).
- [x] 15. **`pnpm build`** — PASSED. Endpoint scorers llamado en build con status 200.
- [x] 16. **`pnpm spec:check`** — Phase-27 sin errores. Errores pre-existentes en phases 18-26 (open tasks en specs completadas, pre-existían).
- [x] 17. **Code Quality** — PASSED tras fixes: filtro `s.team?.id`, regex `̀-ͯ`, `FD_BASE_URL` exportado de fd-team-map, script usa `toCanonicalTeamId`.
- [x] 18. **Reviewer** — APPROVED. Sin violaciones de harness.
- [x] 19. **Security** — APPROVED pre-implementación. Re-verificar contra diff en PR.
- [ ] 20. **Grill re-check** — pendiente.
- [ ] 21. **Preview Vercel** — pendiente (requiere deploy).

## Definition of Done

- [x] Requirements son satisfechos.
- [x] Restricciones de diseño seguidas.
- [x] Gates aplicables ejecutados o documentados como not_applicable.
- [ ] `pnpm spec:check` pasa sin errores de phase-27 (pre-existentes de otras fases documentados).
- [x] Tests corren (384/384).
- [x] `specs/README.md` está actualizado.
- [ ] PR template referencia esta spec.
