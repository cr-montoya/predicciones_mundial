# Requirements: Fase 11 - Deploy y Vercel ISR

## Estado

Completada. Produccion actual en Vercel ISR.

## Objetivo

Desplegar la app con runtime Next.js e ISR para obtener fixtures frescos sin commits manuales.

## Requerimientos

1. `next.config.ts` no debe usar `output: 'export'`.
2. Build debe ser `next build`.
3. Vercel debe manejar previews por PR.
4. Variables server-side deben estar configuradas en Vercel.
5. Páginas principales deben usar `revalidate = 3600`.
6. API keys no deben exponerse al cliente.

## Criterios de éxito

1. Preview de Vercel carga `/`, `/fixtures`, `/fixtures/[id]` y `/groups`.
2. Produccion despliega desde `main`.
3. Runtime logs permiten diagnosticar env/API.
