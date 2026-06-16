# Tasks: Fase 17 - Probabilidades implicitas de casas de apuestas

## 1. Analyst

- [x] Validar formula odd -> probabilidad.
- [x] Validar ajuste de overround.
- [x] Definir umbrales `VALOR+`, `VALOR-`, `NEUTRO`.
- [x] Definir mercados MVP exactos.
- [x] Validar copy tecnico para evitar promesa financiera.

## 2. Design

- [x] Definir badge/columna de diferencial.
- [x] Definir estados sin odds disponibles.
- [x] Validar colores para no sugerir "apostar".
- [x] Revisar mobile y fixture detail.

## 3. Developer

- [x] Crear rama desde `main`: `phase/17-odds-implicitas`.
- [x] Agregar env var server-side para The Odds API.
- [x] Crear `lib/agents/odds-loader.ts`.
- [x] Crear normalizador de odds/equipos.
- [x] Crear `lib/model/skills/value-calc.ts`.
- [x] Integrar odds en mercados 1X2 y O/U 2.5.
- [x] Actualizar UI con diferencial.
- [x] Agregar fallback cuando no hay odds.

## 4. QA

- [x] `pnpm tsc --noEmit`.
- [x] `pnpm test`.
- [x] `pnpm build`.
- [x] Tests de overround.
- [x] Tests de diff en rango [-1, 1].
- [x] Tests de labels.
- [ ] Verificar fixture con odds. (pendiente: requiere THE_ODDS_API_KEY en preview de Vercel)
- [ ] Verificar fixture sin odds. (pendiente: requiere preview de Vercel)

## 5. Reviewer

- [x] Skills sin I/O.
- [x] Agent separado de UI/modelos.
- [x] No hay API key en client.
- [x] Copy mantiene tono informativo.

## 6. Security

- [x] API key no aparece en git.
- [x] API key no aparece en logs.
- [x] No hay llamadas browser a The Odds API.
- [x] Rate limit/cuota documentada.

## 7. Owner review

- [ ] Agregar THE_ODDS_API_KEY en Vercel env vars antes del preview.
- [ ] Revisar preview de Vercel.
- [ ] Validar claridad del diferencial.
- [ ] Validar que no parece recomendacion de apuestas.
- [ ] Aprobar PR antes de merge.
