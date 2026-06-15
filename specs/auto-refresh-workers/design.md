# Design: Auto-refresh con Vercel

## Estado actual

```
scripts/refresh-fixtures.ts
   -> llama football-data.org manualmente
   -> escribe lib/data/fixtures-cache.json (commiteado)

lib/agents/live-loader.ts
   -> import fixturesCache from '@/lib/data/fixtures-cache.json'
   -> lee tournamentPrediction del JSON precomputado

app/page.tsx + app/fixtures/page.tsx + app/groups/page.tsx
   -> export const revalidate = 3600
   -> ignorado en static export

next.config.ts
   -> output: 'export'

package.json build
   -> "next build && node scripts/make-out.mjs"
   -> genera out/ con HTML estático

Cloudflare Pages
   -> sirve out/ como archivos estáticos
```

## Estado objetivo

```
lib/agents/live-loader.ts
   -> llama fetchFixtures() en runtime (football-data.org)
   -> tournament-prediction.json sigue precomputado

app/page.tsx + app/fixtures/page.tsx + app/groups/page.tsx
   -> export const revalidate = 3600
   -> funciona nativo con ISR de Vercel

next.config.ts
   -> sin output: 'export'

package.json build
   -> next build (Vercel lo detecta automáticamente)

Vercel
   -> sirve la app como Next.js con ISR nativo
   -> Vercel cachea cada página en el edge según revalidate
   -> al expirar, la próxima request regenera la página desde el servidor
   -> el servidor llama a la API y sirve datos frescos
```

## Cambios técnicos

### `next.config.ts`

Quitar `output: 'export'`.

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

### `package.json`

Actualizar script de build:

```json
"build": "next build"
```

Eliminar `scripts/make-out.mjs` y su invocación. Vercel no necesita
script de post-build.

### `lib/agents/live-loader.ts`

Cambio central: reemplazar el import estático del JSON por una llamada
en runtime a la API.

Antes:

```ts
import fixturesCache from '@/lib/data/fixtures-cache.json'

export function loadFixtures(): Fixture[] {
  return (fixturesCache as { fixtures: unknown[] }).fixtures as Fixture[]
}
```

Después:

```ts
import { fetchFixtures } from '@/lib/data/api-football'

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

export async function loadFixtures(): Promise<Fixture[]> {
  return fetchFixtures(WC_LEAGUE_ID, WC_SEASON)
}
```

`loadFixtures` pasa de síncrona a `async`. Todos los llamadores
deben agregar `await`.

### `middleware.ts` → `proxy.ts`

Next.js 16 depreca `middleware.ts` en favor de `proxy.ts`. Vercel
soporta la nueva convención plenamente. Renombrar el archivo y
exportar `proxy` en lugar de `middleware`.

```ts
export function proxy(request: NextRequest) { ... }
```

La configuración `config.matcher` no cambia.

### `tournament-prediction.json`

No cambia: el Monte Carlo se sigue precomputando con `pnpm precompute`
y se commitea cuando se quiere una proyección fresca.

### Variables de entorno

La API key de football-data.org debe estar como variable de entorno
en Vercel:

```
FOOTBALLDATA_KEY=<valor>
```

Configurar en: Vercel dashboard → proyecto → Settings → Environment Variables.

Verificar que `lib/data/providers/football-data.ts` lee la key desde
`process.env.FOOTBALLDATA_KEY`.

### Archivos eliminables después de validar

- `scripts/make-out.mjs`
- `lib/data/fixtures-cache.json`
- `wrangler.toml` (o conservar para referencia local con Wrangler)
- `out/`, si existiera trackeado por error

## Flujo de datos

```
Usuario visita /

Vercel Edge cache HIT (< 1 hora desde última generación)
   -> sirve HTML cacheado inmediatamente

Vercel Edge cache MISS (> 1 hora o primer request)
   -> activa el servidor Next.js
   -> ejecuta app/page.tsx (Server Component)
   -> live-loader.ts llama fetchFixtures() -> football-data.org
   -> modelos corren en memoria
   -> servidor devuelve HTML + headers de revalidación
   -> Vercel cachea la respuesta según revalidate = 3600
   -> usuario recibe HTML fresco
```

Resultado: resultados actualizados automáticamente, máximo 1 hora de retraso.
Sin commits manuales. Sin deploy manual.

## Riesgos y compatibilidad

### `better-sqlite3`

Estado: devDependency. `lib/db/client.ts` lo importa con lazy `require()`.

Riesgo: si alguna página importa `lib/db/client.ts` en runtime, falla
en producción porque Vercel serverless no tiene filesystem persistente.

Acción: verificar con grep que ninguna página del App Router importa `lib/db/`.

### `jsonwebtoken`

Estado: dependency de producción. Usado en `lib/auth/jwt.ts`.

Riesgo bajo: `jsonwebtoken` usa `crypto` de Node.js. En el runtime
serverless de Vercel (Node.js), esto funciona sin problema.
Solo sería un issue si se moviera a Edge runtime, lo cual no aplica aquí.

### `framer-motion`

Estado: dependency de producción. Usada en `components/fade-in.tsx` y
`components/bounce-number.tsx` como client components.

Riesgo bajo: framer-motion corre en el browser. Verificar que los
componentes tienen `'use client'`. Si falla el build, usar
`dynamic(() => import(...), { ssr: false })`.

### `fetchFixtures` y rate limiting en build

Durante `next build`, Vercel pre-renderiza las páginas con ISR. Para
`/fixtures/[id]`, `generateStaticParams` genera todas las rutas en
paralelo, lo que puede agotar el rate limit de football-data (10 req/min).

Comportamiento esperado: las páginas que no se pre-renderizan en build
por rate limit se generan on-demand en el primer request. El ISR
de 1h aplica igualmente a todas.

Acción: no requiere cambio; el fallback a mock data durante build es
aceptable. En runtime solo se llama una vez por ventana de 1 hora por ruta.
