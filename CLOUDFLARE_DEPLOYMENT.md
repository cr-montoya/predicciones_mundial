# Desplegar a Cloudflare Pages + D1

Guía paso a paso para desplegar la app en Cloudflare Pages con D1 como BD serverless.

## Prerequisitos

- Cuenta Cloudflare (free tier funciona)
- Cloudflare Wrangler CLI: `npm install -g wrangler`
- GitHub repo del proyecto (para conectar con Pages)

## Paso 1: Crear D1 Database

```bash
# Loguear en Cloudflare
wrangler login

# Crear una BD D1
wrangler d1 create mundial

# El comando mostrará:
# ✅ Successfully created D1 database 'mundial'
# account_id: <tu-account-id>
# database_id: <tu-database-id>
```

Copiar `account_id` y `database_id` y actualizar `wrangler.toml`:

```toml
account_id = "<tu-account-id>"

[[d1_databases]]
binding = "DB"
database_name = "mundial"
database_id = "<tu-database-id>"
```

## Paso 2: Ejecutar Migraciones

Ejecutar el schema de la BD en Cloudflare D1:

```bash
# Copiar el schema local
wrangler d1 execute mundial < lib/db/schema.sql

# Seed de equipos (opcional: ejecutar en local y backup)
wrangler d1 execute mundial --file=data/mundial-seed.sql
```

## Paso 3: Configurar Secretos en Cloudflare

```bash
# Agregar API keys como secrets (no en código)
wrangler secret put RAPIDAPI_KEY
# Ingresa tu API key quando te lo pida

wrangler secret put FOOTBALLDATA_KEY
# Ingresa tu API key

# Verificar que existen
wrangler secret list
```

## Paso 4: Conectar GitHub a Cloudflare Pages

1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pages → Create a project → Connect to Git
3. Seleccionar tu repo (predictor-mundial)
4. Build configuration:
   - **Framework**: Next.js
   - **Build command**: `pnpm build`
   - **Build output directory**: `.next`
5. Environment variables → Agregar:
   - `ENVIRONMENT=production`
   - `RAPIDAPI_KEY` (link desde secret)
   - `FOOTBALLDATA_KEY` (link desde secret)
6. Deploy

## Paso 5: Verificar Deployment

```bash
# Ver logs de la app
wrangler pages view

# Testear la app
curl https://tu-app.pages.dev/

# Si hay errores, revisar:
wrangler pages download
```

## Paso 6: Refresh Manual en Producción

Opción A (desde tu máquina local):
```bash
# Ejecutar refresh contra Cloudflare D1
RAPIDAPI_KEY=<tu-key> FOOTBALLDATA_KEY=<tu-key> pnpm refresh --d1
```

Opción B (Cron automático):
```toml
# En wrangler.toml, descomentar:
[[triggers.crons]]
crons = ["0 */6 * * *"]  # Cada 6 horas
```

Esto ejecutará un Cloudflare Worker automáticamente cada 6 horas.

## Troubleshooting

### D1 devuelve "database_not_found"
- Verificar que `database_id` en `wrangler.toml` es correcto
- Ejecutar: `wrangler d1 info mundial`

### Build falla con "better-sqlite3 not found"
- D1 reemplaza better-sqlite3 en runtime. En build time, Next.js lo ignora.
- Si persiste, crear un stub en `lib/db/client-cloudflare.ts` que no importe better-sqlite3

### Secretos no se propagan
- Después de `wrangler secret put`, esperar 1 minuto
- Redeploy: `wrangler pages deploy`

## Rollback

Si algo sale mal:

```bash
# Revertir último deployment
wrangler pages rollback

# Eliminar BD y recrear
wrangler d1 delete mundial
wrangler d1 create mundial
```

## Notas

- D1 free tier: 1000 queries/day. Si se agota, pasar a plan pago.
- Las migraciones (schema + seed) son idempotentes vía `INSERT OR IGNORE`.
- Backups automáticos: Cloudflare guarda versiones previas (revisar en Dashboard).
