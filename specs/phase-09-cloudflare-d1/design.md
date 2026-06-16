# Design: Fase 9 - Cloudflare D1

## Arquitectura historica propuesta

```
Next.js
   -> Cloudflare Pages / Workers
   -> D1 SQLite serverless
   -> wrangler secrets
```

## Componentes historicos

- `wrangler.toml`.
- `CLOUDFLARE_DEPLOYMENT.md`.
- `data/mundial-seed.sql`.
- Binding `DB`.

## Nota vigente

Produccion actual vive en Vercel ISR. D1/Workers queda como opcion futura si se decide volver a Cloudflare runtime.

## Riesgos historicos

- Incompatibilidad con filesystem.
- Duplicidad entre SQLite local y D1.
- Complejidad innecesaria para una app mayormente ISR.
