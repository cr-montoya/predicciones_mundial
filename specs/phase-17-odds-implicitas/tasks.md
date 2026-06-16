# Tasks: Fase 17 - Probabilidades implicitas de casas de apuestas

## 1. Analyst

- [ ] Validar formula odd -> probabilidad.
- [ ] Validar ajuste de overround.
- [ ] Definir umbrales `VALOR+`, `VALOR-`, `NEUTRO`.
- [ ] Definir mercados MVP exactos.
- [ ] Validar copy tecnico para evitar promesa financiera.

## 2. Design

- [ ] Definir badge/columna de diferencial.
- [ ] Definir estados sin odds disponibles.
- [ ] Validar colores para no sugerir "apostar".
- [ ] Revisar mobile y fixture detail.

## 3. Developer

- [ ] Crear rama desde `main`: `phase/17-odds-implicitas`.
- [ ] Agregar env var server-side para The Odds API.
- [ ] Crear `lib/agents/odds-loader.ts`.
- [ ] Crear normalizador de odds/equipos.
- [ ] Crear `lib/model/skills/value-calc.ts`.
- [ ] Integrar odds en mercados 1X2 y O/U 2.5.
- [ ] Actualizar UI con diferencial.
- [ ] Agregar fallback cuando no hay odds.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Tests de overround.
- [ ] Tests de diff en rango [-1, 1].
- [ ] Tests de labels.
- [ ] Verificar fixture con odds.
- [ ] Verificar fixture sin odds.

## 5. Reviewer

- [ ] Skills sin I/O.
- [ ] Agent separado de UI/modelos.
- [ ] No hay API key en client.
- [ ] Copy mantiene tono informativo.

## 6. Security

- [ ] API key no aparece en git.
- [ ] API key no aparece en logs.
- [ ] No hay llamadas browser a The Odds API.
- [ ] Rate limit/cuota documentada.

## 7. Owner review

- [ ] Revisar preview de Vercel.
- [ ] Validar claridad del diferencial.
- [ ] Validar que no parece recomendacion de apuestas.
- [ ] Aprobar PR antes de merge.
