# Design: Fase 11 - Deploy y Vercel ISR

## Arquitectura vigente

```
Vercel request
   -> Next.js server runtime
   -> ISR revalidate 3600
   -> live-loader fetchFixtures()
   -> render UI
```

## Configuracion

- `next.config.ts` sin static export.
- `package.json` con `build: next build`.
- Env vars en Vercel Production/Preview.
- PR previews como gate antes de merge.

## Relacion con specs infra

- `specs/auto-refresh-workers/` documenta exploracion Workers.
- `specs/vercel-env-csp/` documenta fixes de env/CSP para Vercel.

## Riesgos

- Env vars configuradas solo en production y no preview.
- CSP incompatible con Next/Vercel.
- Cloudflare proxy inyectando scripts.
