# Tasks: Vercel env vars y CSP

## 1. Developer

- [ ] Crear rama desde `main`: `fix/vercel-env-csp`.
- [ ] Confirmar provider activo en `lib/data/fallback.ts`.
- [ ] Confirmar nombre exacto de env var requerido:
  - [ ] `FOOTBALLDATA_KEY`
  - [ ] `RAPIDAPI_KEY`
  - [ ] `API_KEY`
- [ ] Quitar `output: 'export'` si el objetivo es runtime/ISR en Vercel.
- [ ] Ajustar scripts de build para Vercel si siguen orientados a export estático.
- [ ] Crear helper server-only para validar env vars sin exponer valores.
- [ ] Usar el helper en providers de API.
- [ ] Revisar `middleware.ts` y actualizar CSP.
- [ ] Desactivar o documentar desactivación de Cloudflare Rocket Loader.
- [ ] Asegurar que ningún client component importa providers/API/server env.

## 2. Vercel configuration

- [ ] Configurar `FOOTBALLDATA_KEY` en Vercel Project Settings.
- [ ] Habilitar la variable para Production.
- [ ] Habilitar la variable para Preview.
- [ ] Habilitar la variable para Development si se usa `vercel dev`.
- [ ] Redeploy después de crear/editar env vars.
- [ ] Confirmar en build/runtime logs que la variable existe sin imprimir su valor.

## 3. Cloudflare configuration

- [ ] Confirmar si el dominio sigue pasando por Cloudflare proxy.
- [ ] Desactivar Rocket Loader para la app.
- [ ] Desactivar Browser Insights si no se necesita.
- [ ] Si se mantiene Browser Insights, permitir `https://static.cloudflareinsights.com` en CSP.
- [ ] Evitar `unsafe-inline` en producción.

## 4. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test`.
- [ ] `pnpm build`.
- [ ] Deploy preview en Vercel.
- [ ] Revisar `/`.
- [ ] Revisar `/fixtures`.
- [ ] Revisar `/fixtures/[id]`.
- [ ] Revisar `/groups`.
- [ ] Confirmar fixtures/resultados reales.
- [ ] Confirmar DevTools Console sin errores CSP críticos.
- [ ] Confirmar DevTools Network sin llamadas browser a football-data.org.

## 5. Reviewer

- [ ] Secrets solo se leen en server code.
- [ ] Ninguna variable sensible tiene prefijo `NEXT_PUBLIC_`.
- [ ] CSP no usa `unsafe-inline` en producción salvo excepción documentada.
- [ ] No hay imports de providers/server env en client components.
- [ ] El build ya no depende de export estático si se requiere auto-refresh.

## 6. Security

- [ ] API key no aparece en archivos commiteados.
- [ ] API key no aparece en logs.
- [ ] API key no aparece en bundle cliente.
- [ ] CSP mantiene `frame-ancestors 'none'` o `X-Frame-Options: DENY`.
- [ ] Cloudflare scripts permitidos solo si son necesarios.

## 7. Owner review

- [ ] Revisar preview de Vercel.
- [ ] Validar que los datos cargan correctamente.
- [ ] Validar consola limpia o con warnings aceptados.
- [ ] Aprobar PR antes del merge a `main`.

## 8. Rollback

- [ ] Revertir PR si Vercel production falla.
- [ ] Restaurar CSP anterior si una integración crítica falla.
- [ ] Desactivar temporalmente Cloudflare proxy para aislar si el problema viene de inyección.
- [ ] Redeploy último deployment estable desde Vercel.
