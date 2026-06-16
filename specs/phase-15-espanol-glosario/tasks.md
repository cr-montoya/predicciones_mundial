# Tasks: Fase 15 — Español LATAM y glosario de mercados

## 1. Design

- [ ] Definir patrón visual del botón de info.
- [ ] Definir comportamiento desktop/mobile.
- [ ] Validar que el glosario no compita con los números principales.
- [ ] Revisar disclaimer de entretenimiento en páginas clave.

## 2. Analyst

- [ ] Validar descripciones de mercados.
- [ ] Validar ejemplos de lectura de probabilidades.
- [ ] Marcar mercados con confianza naturalmente baja: tarjetas, corners, goleadores.
- [ ] Confirmar que el copy no sugiere asesoría financiera.

## 3. Developer

- [ ] Crear rama desde `main`: `phase/15-spanish-market-info`.
- [ ] Crear `lib/content/markets-es.ts`.
- [ ] Crear helper tipado `getMarketCopy`.
- [ ] Crear componente `MarketInfo`.
- [ ] Conectar glosario en secciones de mercado.
- [ ] Traducir home, fixtures, grupos, candidatos, estados vacíos y errores visibles.
- [ ] Normalizar fechas, horas y porcentajes.
- [ ] Mantener client components pequeños y aislados.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Revisar `/`.
- [ ] Revisar `/fixtures`.
- [ ] Revisar `/fixtures/[id]`.
- [ ] Revisar `/groups`.
- [ ] Buscar strings críticos en inglés.
- [ ] Probar info buttons en desktop.
- [ ] Probar info buttons en mobile.

## 5. Reviewer

- [ ] No hay strings de mercado duplicados innecesariamente.
- [ ] No hay providers/API/server env en client components.
- [ ] La UI mantiene el harness de capas.
- [ ] Los componentes nuevos son pequeños y reutilizables.

## 6. Security

- [ ] No se exponen secrets.
- [ ] No se usa `dangerouslySetInnerHTML`.
- [ ] Popover/dialog no introduce URLs externas inseguras.

## 7. Owner review

- [ ] Revisar preview de Vercel.
- [ ] Validar tono LATAM.
- [ ] Validar comprensión de mercados.
- [ ] Aprobar PR antes de merge.
