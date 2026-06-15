# Requirements: Auto-refresh con Vercel

## Problema

La app está desplegada como export estático en Cloudflare Pages. Los datos vienen de
`lib/data/fixtures-cache.json`, un archivo JSON commiteado en el repo. Cuando termina
un partido, los resultados no aparecen hasta que alguien corre `pnpm refresh-fixtures`
manualmente, commitea el JSON y pushea.

Esto hace la app inservible como predictor en vivo durante el torneo.

## Objetivo

Migrar de export estático a **Next.js en Vercel** con ISR nativo.
La app debe actualizar resultados sola, sin intervención manual, llamando a la API de
football-data.org desde el servidor y usando el cache ISR de Vercel para no agotar la cuota.

## Requerimientos funcionales

1. La home debe mostrar fixtures/resultados frescos sin requerir commits manuales del JSON.
2. Las páginas `/fixtures`, `/fixtures/[id]` y `/groups` deben consumir el mismo origen fresco de fixtures.
3. El cache ISR de Vercel debe limitar las llamadas a football-data.org a máximo una por hora por ruta.
4. `tournament-prediction.json` se mantiene precomputado porque Monte Carlo es costoso.
5. La API key de football-data.org debe usarse solo en servidor, nunca en el browser.
6. La app debe poder validarse en preview deployment antes de mergear a `main`.

## Requerimientos no funcionales

1. Mantener el harness de capas: UI no llama APIs externas directamente.
2. Compatibilidad con Vercel Hobby plan (sin funciones de pago).
3. No reintroducir D1 ni cron para esta fase.
4. No depender de filesystem persistente en runtime.
5. El cambio debe preservar los tests de modelo existentes.

## Criterio de éxito

1. `pnpm test` pasa sin cambios en la lógica estadística.
2. `pnpm build` completa sin errores.
3. En preview de Vercel, `/` muestra los partidos de hoy con resultados reales.
4. Después de 1 hora, una nueva visita refleja resultados actualizados sin intervención manual.
5. `lib/data/fixtures-cache.json` ya no es necesario actualizar manualmente.
