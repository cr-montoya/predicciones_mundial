# Requirements: Fase 16 — Goleadores y mercados extendidos

## Problema

La página de detalle de partido todavía ofrece pocos mercados para contenido. Hay buenas
predicciones base de resultado y goles, pero falta enriquecer la experiencia con goleadores
y mercados derivados que hagan cada partido más útil y atractivo.

## Objetivo

Agregar predicciones de goleadores y más mercados derivados por partido, manteniendo
Vercel ISR, el harness de capas y la seguridad de API keys server-side.

## Requerimientos funcionales

1. La página de detalle debe mostrar más mercados por partido.
2. Debe existir soporte para mercados de goles por equipo:
   - Local más de 0.5 / 1.5 / 2.5 goles.
   - Visitante más de 0.5 / 1.5 / 2.5 goles.
3. Debe existir soporte para combinados simples:
   - Resultado + ambos marcan.
   - Resultado + más de 1.5 / 2.5 goles.
   - Gana a cero.
4. Debe existir una primera versión de mercado de goleadores:
   - Goleador en cualquier momento.
   - Primer goleador si hay datos suficientes.
5. Si no hay datos confiables de jugadores, la UI debe mostrar mercado no disponible o
   confianza baja, no inventar precisión.
6. Todos los nuevos outputs deben tener `confidence`, `modelVersion` y `computedAt`.

## Requerimientos no funcionales

1. Models y skills no llaman APIs externas.
2. Agents/providers son los únicos responsables de traer datos externos.
3. Client components no importan modelos ni providers.
4. La API key no debe llegar al browser.
5. Los cálculos deben ser baratos para runtime ISR.
6. Monte Carlo de torneo sigue precomputado.

## Criterios de éxito

1. Los nuevos mercados aparecen en fixture detail sin romper la home.
2. Fixture detail renderiza con y sin datos de jugadores.
3. Probabilidades derivadas se mantienen entre 0 y 1.
4. Tests cubren mercados nuevos y edge cases.
5. `pnpm test` y `pnpm build` pasan.
6. Preview de Vercel aprobado por owner antes de merge.
