# PLAN.md — Mundial 2026 IA Predictor

Plan de implementación por fases. Objetivo: app en Next.js que corre en local, recalcula bajo demanda y proyecta todos los mercados estadísticos por partido, lista para grabar contenido.

---

## Arquitectura general

```
Refresh manual (script o botón "Actualizar")
   -> Ingesta de data (API-Football)
   -> Normaliza y guarda en SQLite (archivo local)
   -> Corre el modelo de predicción
   -> Guarda predicciones con timestamp
   -> Dashboard (Next.js) lee de SQLite y renderiza
```

Todo corre en local con `pnpm dev`. No hay proceso 24/7 ni deploy: tú disparas el refresh cuando quieres, controlando el consumo de la API.

Tres capas separadas: ingesta (data cruda), modelo (math puro, sin red), presentación (UI). El modelo nunca llama a la API; solo consume lo que ya está en DB. Esto lo hace testeable y rápido.

---

## Fuentes de datos

1. **API-Football (RapidAPI)** — recomendada. Tiene fixtures, resultados en vivo, lineups, eventos (goles, tarjetas, minuto), estadísticas por partido (corners, shots, posesión) y stats por jugador. Plan free: 100 requests/día.
2. **football-data.org** — free, buena para fixtures y resultados, sirve de fallback.

---

## Mercados que proyecta el modelo

- **Resultado 1X2**: gana local / empate / gana visitante.
- **Doble oportunidad**: 1X, 12, X2.
- **Over/Under goles**: líneas 1.5, 2.5, 3.5.
- **BTTS** (ambos marcan): sí / no.
- **Marcador exacto**: top 5 marcadores más probables.
- **Goleador**: primer goleador y goleador en cualquier momento.
- **Total de tarjetas**: over/under 3.5, probabilidad de roja.
- **Corners**: over/under (línea dinámica).
- **Clean sheet / gana a cero**.
- **Torneo**: clasificados por grupo, proyección de campeón, Bota de Oro.

---

## El modelo (lib/model/)

- **Base**: distribución de Poisson sobre goles esperados (xG). Estándar de la industria para proyectar goles, BTTS, over/under y marcador exacto.
- **Lambda (goles esperados)**: fuerza ofensiva del equipo, fuerza defensiva del rival, ranking FIFA, forma reciente (últimos 5-10 partidos), ventaja de sede.
- **Tarjetas y corners**: regresión sobre promedios históricos ajustada por intensidad del partido.
- **Goleadores**: reparte el lambda del equipo entre jugadores según goles por minuto histórico.
- **Campeón / Bota de Oro**: Monte Carlo — correr el torneo 10.000 veces y contar frecuencias.

---

## Fases

### Fase 0 — Setup
- create-next-app con TS, Tailwind, App Router.
- shadcn/ui init, Recharts, better-sqlite3, vitest.
- Estructura: app/, lib/data/, lib/model/, lib/db/, scripts/refresh.ts.
- DB en data/mundial.db (gitignored).
- .env.example con RAPIDAPI_KEY.

### Fase 1 — Ingesta y DB
- Schema SQLite: teams, players, fixtures, match_events, match_stats, predictions.
- Cliente de API-Football con retry y cache.
- Seed de los 12 grupos y 48 equipos del Mundial 2026.

### Fase 2 — Modelo de predicción
- lib/model/poisson.ts: goles esperados -> matriz de probabilidad de marcadores.
- Derivar de esa matriz: 1X2, over/under, BTTS, marcador exacto.
- lib/model/cards.ts, corners.ts, scorers.ts, montecarlo.ts.
- Tests con vitest para validar que los números tienen sentido.

### Fase 3 — Refresh bajo demanda
- scripts/refresh.ts: trae resultados nuevos, actualiza forma, recalcula predicciones. Se corre con `pnpm refresh`.
- Server Action de refresh para el botón "Actualizar" del dashboard, reutilizando la misma lógica que el script.
- Guarda de frescura: el refresh no vuelve a llamar a la API si la última corrida fue hace menos de N minutos (protege la cuota free de 100 req/día).
- Sin node-cron ni scheduler: el control de cuándo refrescar es manual.

### Fase 4 — Dashboard
- Home: proyección de campeón (Monte Carlo) + Bota de Oro.
- Vista grupo: tabla proyectada de clasificación.
- Vista partido: todos los mercados en cards visuales.
- Diseño oscuro, tipografía grande, colores por probabilidad.

### Fase 5 — Pulido
- Animaciones con framer-motion.
- Banner: "Análisis estadístico de entretenimiento. No es asesoría de apuestas."
- Modo captura: vista limpia para los clips.
- Indicador de "última actualización" (timestamp de la última corrida) visible en la UI.

### Fase 6 — Diseño Broadcast
- **Estilo visual**: Look de terminal de datos deportiva (broadcast / Opta). Números grandes como protagonista. Fondo oscuro con acento. Visualizaciones custom (no Recharts default).
- **Home rediseñado**:
  - Partidos del día (fixtures con estado y horario)
  - Top 10 mercados recomendados (highest-probability markets across all matches)
  - Candidatos a campeón y Bota de Oro (secundarios, pero presentes)
- **Paleta**: Oscuro + un acento (dorado, cian, verde). Sin gradientes morados genéricos. Sin cards redondeadas flotando.
- **Tipografía**: Monoespaciada (ya en Tailwind), números en 3xl/4xl, etiquetas en caps tracking-widest.

### Fase 7 — Branding FIFA World Cup 2026
- **Logo y colores oficiales**: Rojo (#c8102e) + Verde México (#009a44) + Azul Canadá (#002868) + Fondo navy (#060d1a).
- **Header mejorado**: Trofeo SVG en rojo, franja horizontal de 3 colores (rojo-verde-azul).
- **Hero badge**: "FIFA WORLD CUP" con fondo rojo, texto oscuro.
- **Layout hero refinado**: Número de partidos más proporcional, alineado horizontalmente con texto descriptivo.
- **Candidatos expandibles**: Botón "VER MÁS →" para expandir lista completa (top 5 por defecto).

### Fase 8 — Datos históricos para calibración de equipos
- **Problema**: Todos los equipos están en `attack_strength = defense_strength = 1.0`, causando probabilidades uniformes (~2% todos).
- **Solución**: Precomputar stats históricos (últimos 4 años de competiciones: Mundiales 2022/2018, Copas América, Euros, Clasificatorias).
- **Implementación**:
  - Crear `lib/data/historical-stats.json` con `attack_strength` y `defense_strength` por equipo.
  - En `run-refresh.ts`, cargar stats del JSON y pasarlos a `recomputeStrengths()`.
  - Resultado: France, Spain, Argentina, etc. suben a 5-10% en tournament_winner; Haiti baja a <1%.
- **Verificación**: `pnpm refresh` y validar DB que France > 1.0 attack_strength.

### Fase 9 — Migración a Cloudflare D1
- **Objetivo**: Deploy serverless en Cloudflare Pages (free tier: 500 builds/mes, capacidad ilimitada de lectura/escritura en D1).
- **Arquitectura Hybrid**:
  - **Local dev**: `better-sqlite3` (como ahora). `pnpm dev`, `pnpm refresh` funcionan sin cambios.
  - **Cloudflare production**: D1 (SQLite serverless). Schema + seed se ejecutan via `wrangler d1 execute`.
  - El código `lib/db/client.ts` NO cambia: funciona con better-sqlite3 en local, y en Cloudflare Pages el binding `DB` está inyectado en `globalThis`.
- **Archivos nuevos**:
  - `wrangler.toml`: configuración Cloudflare (D1 binding, cron trigger, secrets).
  - `next.config.js`: adapter `@cloudflare/next-on-pages` para Pages.
  - `CLOUDFLARE_DEPLOYMENT.md`: guía paso a paso de setup (manual, no CI/CD).
  - `data/mundial-seed.sql`: seed de 48 equipos para ejecutar en D1.
- **Configuración Wrangler**:
  - Crear BD: `wrangler d1 create mundial`
  - Migrar schema: `wrangler d1 execute mundial < lib/db/schema.sql`
  - Seed teams: `wrangler d1 execute mundial --file=data/mundial-seed.sql`
  - Secrets: `wrangler secret put RAPIDAPI_KEY` y `FOOTBALLDATA_KEY`.
- **Testing local**: `wrangler dev` simula D1 localmente (opcional: solo test de build).
- **Verificación**: 
  - `pnpm build` compila sin errores (no requiere better-sqlite3 en runtime de Cloudflare).
  - Security audita: no hay `fs` imports en código de Pages, secrets en `wrangler.toml` (no hardcodeados).

### Fase 10 — Hardening & Autenticación
- **Objetivo**: Asegurar la app antes del deploy con rate limiting, autenticación simple y security headers.
- **Rate Limiting** (por IP):
  - Implementar middleware que limita requests por IP (ej. 30 req/min para endpoints de refresh).
  - Usar `request.ip` en Next.js; guardar contador en Cloudflare KV (replicable) o en-memoria con key `IP:timestamp`.
  - Retornar HTTP 429 si se excede límite.
- **Autenticación simple**:
  - Crear tabla `users` en DB: `id, username, password_hash, created_at`.
  - Hash de passwords: usar `bcrypt` (pnpm add bcrypt).
  - Endpoint de login: `POST /api/auth/login` que devuelve JWT en httpOnly cookie.
  - JWT include: `{ sub: userId, exp: now + 7 days }`.
  - Middleware: verificar JWT antes de acceder a refresh y otras operaciones sensibles.
  - Seed: crear un usuario de demo (username: `demo`, password: generado aleatoriamente, compartible).
- **Security Headers** (middleware o Next.js config):
  - `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...'` (mitigar XSS).
  - `X-Content-Type-Options: nosniff` (evitar sniffing de MIME types).
  - `X-Frame-Options: DENY` (evitar clickjacking).
  - `Strict-Transport-Security: max-age=31536000` (HTTPS only).
  - `Referrer-Policy: no-referrer-when-downgrade`.
- **Verificación**:
  - Security agent audita: no hay secrets nuevos, headers correctos, rate limit funciona.
  - Tests de autenticación: login correcto, JWT expirado rechazado, rate limit activa.
  - `pnpm test` pasa 169+ tests.

### Fase 11 — Deploy a Cloudflare Pages
- **Preparación**:
  - Crear cuenta Cloudflare (free).
  - Crear D1 database en dashboard de Cloudflare.
  - Crear proyecto en Pages y conectar repo de GitHub.
- **Build & Deploy**:
  - Pages automáticamente detecta Next.js.
  - Environment variables (RAPIDAPI_KEY, etc.) configuradas en Settings → Environment variables.
  - D1 binding inyectado via `wrangler.toml`.
- **Post-Deploy**:
  - Verificar que `/` carga correctamente (home page).
  - Ejecutar refresh manual desde dashboard (si aplica).
  - Revisar logs en Cloudflare Analytics.
- **Ventajas**:
  - Zero cold starts gracias a Cloudflare edge.
  - D1 escala automáticamente sin costo adicional en free tier.
  - HTTPS automático con certificados Cloudflare.
  - Global CDN para assets estáticos (JS, CSS).

---

## Agentes y flujo de verificación

Cada fase se valida con estos 4 agentes en secuencia:

1. **Analyst** (si hay cambios de modelo): valida matemática, contratos, lambdas.
2. **Developer** (si hay cambios de código): implementa siguiendo harness.
3. **QA** (siempre): corre tests, valida sanity checks de outputs. Tests pasan = ✅.
4. **Reviewer** (siempre): audita harness, capas, convenciones. Sin bloqueantes = ✅.
5. **Security** (siempre, crítico antes de Cloudflare): detección de vulns, exposure de secretos, OWASP. Sin CRÍTICO = ✅.

**Flujo**: Analyst → Developer → QA → Reviewer → Security → Aprobado.

Si alguno reporta bloqueante: vuelve a Developer para arreglo, luego re-valida desde QA.

---

## Riesgos

- **Límite API free**: como el refresh es manual y tiene guarda de frescura, tú controlas cada llamada y respetas los 100 req/día. Para data en vivo durante partidos hay que pasar a plan pago.
- **Calidad de predicciones**: Poisson es sólido para goles, más ruidoso para tarjetas/corners. Mostrar confianza baja en esos mercados.
- **Legal**: mientras la app solo muestre probabilidades y no reciba dinero, es análisis estadístico.
- **Cloudflare D1**: aunque el free tier es amplio, si la BD crece mucho, considera plan pago de Cloudflare.