# Requirements: Vercel env vars y CSP

## Problema

La app fue migrada a Vercel y no está cargando la variable de API aunque está definida.
Al inspeccionar el navegador aparecen errores de CSP relacionados con scripts de
Cloudflare:

- `static.cloudflareinsights.com/beacon.min.js` bloqueado por `script-src 'self'`.
- `rocket-loader.min.js` ejecutando inline scripts bloqueados por `script-src 'self'`.
- Un error secundario de conexión cerrada en un chunk del cliente.

Estos errores pueden coexistir con el problema de env vars, pero no necesariamente
tienen la misma causa. Hay que separar diagnóstico de frontend/CSP y diagnóstico de
runtime/env server-side.

## Objetivo

Hacer que la app en Vercel:

1. Lea correctamente la API key desde variables de entorno server-side.
2. No exponga secrets al browser.
3. No rompa scripts legítimos por CSP.
4. No dependa de scripts inyectados por Cloudflare para funcionar.
5. Tenga una verificación clara en preview antes de tocar producción.

## Requerimientos funcionales

1. La app debe cargar fixtures desde el provider configurado usando `FOOTBALLDATA_KEY`
   o la variable de API que corresponda al provider activo.
2. Si falta la variable de entorno en Vercel, la app debe fallar con un error server-side
   claro en logs, no con un error ambiguo en cliente.
3. Las páginas principales deben renderizar en Vercel preview:
   - `/`
   - `/fixtures`
   - `/fixtures/[id]`
   - `/groups`
4. El CSP debe permitir los scripts necesarios para Next/Vercel y bloquear inyecciones
   no deseadas.
5. Si Cloudflare sigue delante de Vercel como proxy/CDN, Browser Insights/Rocket Loader
   deben desactivarse o permitirse explícitamente de forma controlada.

## Requerimientos no funcionales

1. Ninguna API key debe usar prefijo `NEXT_PUBLIC_`.
2. Ninguna API key debe imprimirse en consola ni enviarse al cliente.
3. La solución debe funcionar en Vercel Production, Preview y Development.
4. La configuración debe quedar documentada para que cada PR pueda revisarse desde el
   preview deployment.
5. El fix no debe debilitar CSP con `unsafe-inline` en producción salvo que exista una
   justificación temporal y una tarea de follow-up.

## Criterios de éxito

1. Vercel logs muestran que la variable requerida existe sin revelar su valor.
2. `/` renderiza fixtures reales en preview y producción.
3. No aparecen errores CSP que bloqueen scripts necesarios para la app.
4. Si Cloudflare está proxying el dominio, Rocket Loader no inyecta scripts que rompan
   la app.
5. `pnpm build` y `pnpm test` pasan antes del PR.
