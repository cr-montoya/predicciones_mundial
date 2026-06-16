# Tasks: Fase 18 - Datos de jugadores enriquecidos

## 1. Analyst

- [ ] Redefinir contrato de `scorers.ts` con `starterProbability`.
- [ ] Validar valores para lesionado/duda/suspendido.
- [ ] Definir reglas de confidence.
- [ ] Validar efecto de lineup en probabilidades.

## 2. Design

- [ ] Definir badge de lineup confirmado.
- [ ] Definir estado `Datos limitados`.
- [ ] Definir timestamp visual.
- [ ] Revisar mobile en fixture detail.

## 3. Developer

- [ ] Crear rama desde `main`: `phase/18-jugadores-lineups`.
- [ ] Crear `lib/agents/lineups-loader.ts`.
- [ ] Normalizar lineups por `fixtureId`.
- [ ] Integrar injuries/suspensions si fuente disponible.
- [ ] Actualizar contrato de `scorers.ts`.
- [ ] Agregar Server Action manual near-kickoff si se aprueba MVP.
- [ ] Actualizar UI de goleadores.
- [ ] Agregar fallback sin lineup.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Test lineup completo.
- [ ] Test sin lineup.
- [ ] Test jugador lesionado.
- [ ] Test jugador suspendido.
- [ ] Smoke test fixture detail near-kickoff.

## 5. Reviewer

- [ ] Agents concentran llamadas externas.
- [ ] Models/skills siguen puros.
- [ ] Server Action protegida si existe.
- [ ] UI no importa providers.

## 6. Security

- [ ] API key solo server-side.
- [ ] Rate limit en refresh manual.
- [ ] No logs de payloads sensibles.
- [ ] No endpoint publico sin proteccion para quemar cuota.

## 7. Owner review

- [ ] Revisar preview de Vercel.
- [ ] Validar copy de confianza.
- [ ] Validar que lineup mejora se entiende.
- [ ] Aprobar PR antes de merge.
