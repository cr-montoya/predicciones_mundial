# Tasks: Auto-refresh con Vercel

## 1. Developer

- [ ] Agregar `@cloudflare/next-on-pages` a devDependencies (NO — no se necesita para Vercel).
- [x] Actualizar `next.config.ts` y quitar `output: 'export'`.
- [x] Actualizar script `build` en `package.json` a `next build`.
- [x] Migrar `lib/agents/live-loader.ts`: `loadFixtures` pasa a ser async con fetch runtime.
- [x] Agregar `await` en páginas que llamen `loadFixtures()` directamente.
- [ ] Renombrar `middleware.ts` a `proxy.ts` y exportar función `proxy` (Next.js 16).
- [ ] Confirmar `FOOTBALLDATA_KEY` en `.env.local` para pruebas locales.
- [x] Mantener `tournament-prediction.json` como dato precomputado.
- [ ] Eliminar `scripts/make-out.mjs` (ya no se usa).

## 2. QA

- [ ] `pnpm tsc --noEmit`.
- [ ] `pnpm test` (la lógica de modelos no cambia).
- [ ] `pnpm build`.
- [ ] `pnpm dev` + smoke test local de `/`, `/groups`, `/fixtures`, `/fixtures/[id]`.
- [ ] Verificar que no hay imports de `lib/db` en páginas del App Router.
- [ ] Verificar que `FOOTBALLDATA_KEY` no está hardcodeada en ningún archivo.

## 3. Reviewer

- [ ] Sin imports de `lib/db` en páginas del App Router.
- [ ] `loadFixtures` es async en todas las páginas que la llaman.
- [ ] Secretos no expuestos en código.
- [ ] `scripts/make-out.mjs` queda eliminado o claramente fuera del build.
- [ ] `fixtures-cache.json` no se usa en runtime.

## 4. Security

- [ ] `FOOTBALLDATA_KEY` no aparece en ningún archivo commiteado.
- [ ] API key solo viaja servidor -> API, nunca al browser.
- [ ] Sin nuevas dependencias de producción.
- [ ] Sin logs de secrets ni responses sensibles.

## 5. Deploy

- [ ] Conectar repo a Vercel (vercel.com → Add New Project → importar repo).
- [ ] Configurar `FOOTBALLDATA_KEY` como variable de entorno en Vercel dashboard.
- [ ] Framework preset: Next.js (Vercel lo detecta automáticamente).
- [ ] Build command: `pnpm build` (o dejar el default de Vercel).
- [ ] Verificar preview deployment con resultados frescos.
- [ ] Revisar Vercel logs sin errores de runtime.
- [ ] Owner aprueba PR y preview.
- [ ] Merge a `main`.
- [ ] Verificar producción con auto-refresh.

## 6. Rollback

- [ ] Revertir PR si producción falla.
- [ ] Restaurar `output: 'export'` y `scripts/make-out.mjs` si se necesita volver al estático.
- [ ] Mantener `fixtures-cache.json` hasta validar preview y producción.
