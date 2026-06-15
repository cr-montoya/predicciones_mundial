# Design: Vercel env vars y CSP

## Diagnóstico esperado

Hay dos problemas distintos que pueden verse al mismo tiempo:

1. **Env var no disponible en runtime/build de Vercel**.
2. **CSP bloqueando scripts inyectados por Cloudflare**.

Los errores de CSP del navegador no prueban por sí solos que la API key falte. La API key
se lee en servidor mediante `process.env.FOOTBALLDATA_KEY`, así que el diagnóstico real
debe venir de logs de Vercel o de un endpoint/server component que valide presencia sin
exponer el valor.

## Estado actual relevante

### CSP

`middleware.ts` define en producción:

```txt
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
```

Esto bloquea:

- `https://static.cloudflareinsights.com/beacon.min.js`
- Inline scripts que Rocket Loader intenta ejecutar.

### Env vars

`lib/data/providers/football-data.ts` lee:

```ts
const key = process.env.FOOTBALLDATA_KEY
```

Si la variable no existe, lanza:

```txt
Missing required environment variable: FOOTBALLDATA_KEY
```

### Runtime

Si la app sigue con `output: 'export'`, no hay runtime server en Vercel para refrescar
datos por request. En export estático, los datos y env vars usados por server code quedan
resueltos durante build. Para auto-refresh en Vercel, la app debe correr como Next server
runtime o ISR, no como export estático puro.

## Diseño de solución

### 1. Confirmar el provider y nombre exacto de variable

Validar cuál provider está activo:

- `FootballDataProvider` requiere `FOOTBALLDATA_KEY`.
- `ApiFootballProvider` requiere `API_KEY` o `RAPIDAPI_KEY`.

La variable configurada en Vercel debe coincidir exactamente con el provider usado por
`lib/data/fallback.ts`.

### 2. Configurar Vercel env vars por ambiente

En Vercel Project Settings -> Environment Variables:

- `FOOTBALLDATA_KEY`: Production, Preview y Development si se usarán los tres.
- `RAPIDAPI_KEY` o `API_KEY`: solo si el fallback/provider lo necesita.

Después de crear o editar env vars, redeploy obligatorio. Vercel no inyecta cambios de
env en deployments ya construidos.

### 3. Agregar verificación server-side sin exponer secrets

Crear una utilidad server-only:

```ts
export function requireServerEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`)
  }
  return value
}
```

Usarla en providers para estandarizar errores. No retornar valores al cliente.

Opcional para diagnóstico temporal:

- Loguear solo presencia y longitud de la variable en server logs.
- Eliminar el log después de validar.
- Nunca loguear el valor.

### 4. Decidir runtime en Vercel

Si se quiere auto-refresh con ISR/runtime:

- Quitar `output: 'export'` de `next.config.ts`.
- Quitar scripts custom de export estático si siguen activos.
- Usar `export const revalidate = 3600` en páginas server.
- Asegurar que `loadFixtures()` corre en server y no en client components.

Si se quiere mantener export estático:

- La API key solo se usa en build.
- Cada cambio de datos requiere redeploy.
- No hay auto-refresh real.

Para el objetivo actual, la opción correcta es runtime/ISR en Vercel.

### 5. Arreglar CSP sin abrir demasiado

Opción recomendada si Cloudflare solo apunta al dominio de Vercel:

- Desactivar Rocket Loader para este sitio/ruta.
- Desactivar Cloudflare Browser Insights si no es necesario.
- Mantener CSP estricta.

Opción alternativa si se quieren mantener Cloudflare scripts:

```txt
script-src 'self' https://static.cloudflareinsights.com;
connect-src 'self' https://vitals.vercel-insights.com https://api.football-data.org;
```

No recomendar `unsafe-inline` en producción. Rocket Loader depende de inline scripts, así
que permitirlo debilita CSP. Es mejor desactivar Rocket Loader.

### 6. CSP compatible con Vercel

Agregar como mínimo:

```txt
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://vitals.vercel-insights.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Si la app hace fetch directo desde browser a algún dominio externo, ese dominio debe ir
en `connect-src`. La API de football-data no debería estar en browser; si aparece en
Network del cliente, hay una fuga de arquitectura.

### 7. Validación en Vercel

Usar preview deployment del PR:

1. Revisar Vercel build logs.
2. Revisar runtime logs al cargar `/`.
3. Confirmar que `FOOTBALLDATA_KEY` existe sin mostrar valor.
4. Abrir DevTools -> Network y confirmar que la API externa no se llama desde browser.
5. Abrir DevTools -> Console y confirmar que no hay CSP bloqueando scripts necesarios.

## Riesgos

### Cloudflare delante de Vercel

Si Cloudflare sigue proxying el dominio, puede inyectar scripts aunque la app esté en
Vercel. Rocket Loader puede romper Next.js y CSP.

Mitigación: crear Page Rule/Configuration Rule para desactivar Rocket Loader en el dominio
o cambiar el registro a DNS only si no se necesita proxy.

### Env vars solo en Production

Si la variable está marcada solo para Production, los previews fallan.

Mitigación: habilitar la variable también para Preview.

### Static export

Si `output: 'export'` sigue activo, no hay runtime server para auto-refresh.

Mitigación: migrar a Next runtime/ISR en Vercel.

### Secrets expuestos por accidente

Usar `NEXT_PUBLIC_FOOTBALLDATA_KEY` expondría la key al browser.

Mitigación: mantener secrets sin `NEXT_PUBLIC_` y consumirlos solo desde server code.
