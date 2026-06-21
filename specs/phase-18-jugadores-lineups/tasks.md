# Tasks: Fase 18 - Datos de jugadores enriquecidos

## 1. Analyst

- [x] Redefinir contrato de `scorers.ts` con `starterProbability`.
- [x] Validar valores para lesionado/duda/suspendido.
- [x] Definir reglas de confidence.
- [x] Validar efecto de lineup en probabilidades.

## 2. Design

- [x] Definir badge de lineup confirmado.
- [x] Definir estado `Datos limitados`.
- [x] Definir timestamp visual.
- [x] Revisar mobile en fixture detail.

## 3. Developer

- [x] Crear rama desde `main`: `phase/18-jugadores-lineups`.
- [x] Crear `lib/agents/lineups-loader.ts`.
- [x] Normalizar lineups por `fixtureId`.
- [x] Integrar injuries/suspensions si fuente disponible.
- [x] Actualizar contrato de `scorers.ts`.
- [ ] Agregar Server Action manual near-kickoff — DEFERRED: On-Demand Revalidation queda para fase futura.
- [x] Actualizar UI de goleadores.
- [x] Agregar fallback sin lineup.

## 4. QA

- [x] `pnpm tsc --noEmit` — PASS.
- [x] `pnpm test` — 361/361 PASS.
- [x] `pnpm build` — PASS.
- [x] Test lineup completo.
- [x] Test sin lineup.
- [x] Test jugador lesionado.
- [x] Test jugador suspendido.
- [ ] Smoke test fixture detail near-kickoff — pendiente de preview Vercel.

## 5. Reviewer

- [x] Agents concentran llamadas externas.
- [x] Models/skills siguen puros.
- [x] Server Action protegida si existe — N/A (diferida).
- [x] UI no importa providers.

## 6. Security

- [x] API key solo server-side.
- [x] Rate limit en refresh manual — N/A (Server Action diferida).
- [x] No logs de payloads sensibles.
- [x] No endpoint público sin protección para quemar cuota.

## 7. Owner review

- [ ] Revisar preview de Vercel.
- [ ] Validar copy de confianza.
- [ ] Validar que lineup mejora se entiende.
- [ ] Aprobar PR antes de merge.
