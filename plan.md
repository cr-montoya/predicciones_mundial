# PLAN.md — Mundial 2026 IA Predictor

Plan de implementación por fases. Objetivo: app en Next.js desplegada en Vercel con ISR, datos frescos de fixtures en runtime, mercados estadísticos por partido y una UI lista para contenido sin romper el harness.

---

## Arquitectura general

```
Request a Vercel
   -> ISR / revalidate cada 1 hora
   -> live-loader trae fixtures desde football-data.org en runtime server
   -> Normaliza fixtures y calcula mercados baratos con Poisson
   -> Lee Monte Carlo precomputado desde lib/data/tournament-prediction.json
   -> UI Next.js renderiza home, fixtures, grupos y detalle de partido
```

Estado actual: la app está en **Vercel ISR**. Ya no usa `output: 'export'` ni `out/` como fuente de producción. Los fixtures se cargan en runtime server con `FOOTBALLDATA_KEY`, y Vercel cachea/regenera las páginas con `revalidate = 3600`. El torneo sigue precomputado porque Monte Carlo es más costoso y se actualiza con `pnpm precompute` cuando haga falta.

Tres capas separadas: ingesta (data cruda), modelo (math puro, sin red), presentación (UI). El modelo nunca llama a la API; solo consume fixtures/stats normalizados o JSON precomputados. Esto lo hace testeable, rápido y compatible con ISR.

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
- **Estado**: Histórica / sustituida por Vercel ISR. Se conserva como contexto de decisiones anteriores, no como arquitectura vigente.
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
- **Estado**: Completada como base de seguridad/autenticación. Revisar compatibilidad con Vercel en fixes específicos cuando toque middleware, CSP o env vars.
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

### Fase 11 — Deploy inicial y cambio de plataforma
- **Estado**: Completada. Producción actual en Vercel ISR.
- **Estado histórico**: primero se exploró Cloudflare Pages/D1/export estático.
- **Estado actual**: producción vive en **Vercel** con Next.js runtime e ISR.
- **Build & Deploy actual**:
  - `next.config.ts` sin `output: 'export'`.
  - `package.json` usa `pnpm build` → `next build`.
  - Vercel maneja previews por PR y production desde `main`.
  - Variables server-side en Vercel: `FOOTBALLDATA_KEY` y cualquier fallback requerido.
- **Post-Deploy**:
  - Verificar que `/`, `/fixtures`, `/fixtures/[id]` y `/groups` cargan en preview.
  - Verificar Vercel Runtime Logs cuando hay errores de env/API.
  - Revisar consola del navegador para CSP, pero diagnosticar secrets solo desde logs server-side.

### Arquitectura actual (post-Fase 14 + fixes de infraestructura)
La app migró a **Vercel ISR**:
- Fixtures: `lib/agents/live-loader.ts` llama `fetchFixtures()` en runtime server.
- Cache: páginas con `export const revalidate = 3600`.
- Fuerzas de equipos: `lib/data/historical-stats.json` + skill `computeStrengths`.
- Torneo: `lib/data/tournament-prediction.json` (Monte Carlo pre-generado con `pnpm precompute`).
- Build Vercel: `pnpm build` → `next build`. Sin `out/` ni `scripts/make-out.mjs`.
- CSP: ajustado para Next/Vercel y revisado en fixes posteriores.
- Navegación: fix de nav visible ya mergeado.

### Estado resumido del roadmap
- **Completadas**: Fases 0-16.
- **Siguiente fase de producto**: Fase 17 — Probabilidades implícitas de casas de apuestas.
- **Después**: Fase 18 — Datos de jugadores enriquecidos (lineups + lesiones).

### Índice de specs por fase
- Fase 0: `specs/phase-00-setup/`
- Fase 1: `specs/phase-01-ingesta-db/`
- Fase 2: `specs/phase-02-modelo-prediccion/`
- Fase 3: `specs/phase-03-refresh-demanda/`
- Fase 4: `specs/phase-04-dashboard/`
- Fase 5: `specs/phase-05-pulido/`
- Fase 6: `specs/phase-06-diseno-broadcast/`
- Fase 7: `specs/phase-07-branding-world-cup/`
- Fase 8: `specs/phase-08-datos-historicos/`
- Fase 9: `specs/phase-09-cloudflare-d1/` (histórica)
- Fase 10: `specs/phase-10-hardening-auth/`
- Fase 11: `specs/phase-11-deploy-vercel-isr/`
- Fase 12: `specs/phase-12-datos-historicos-enriquecidos/`
- Fase 13: `specs/phase-13-predicciones-fixture-cards/`
- Fase 14: `specs/phase-14-sistema-visual-design/`
- Fase 15: `specs/phase-15-espanol-glosario/`
- Fase 16: `specs/phase-16-goleadores-mercados/`
- Fase 17: `specs/phase-17-odds-implicitas/`
- Fase 18: `specs/phase-18-jugadores-lineups/`

### Fase 12 — Datos históricos enriquecidos
- **Estado**: Completada.
- **Problema**: `historical-stats.json` tiene datos limitados (WC2022, Copa América 2024, EURO 2024). El modelo Poisson no distingue bien entre selecciones de fuerza similar.
- **Objetivo**: Añadir más competiciones (Eliminatorias 2022/2026, Nations League, Confederaciones) y más años (2020-2026). Evaluar ponderación por tipo de competición (torneo > eliminatorias > amistoso).
- **Flujo harness**: Analyst valida fuentes y fórmula de ponderación → Developer enriquece `historical-stats.json` y actualiza `computeStrengths` si cambia el contrato → QA valida coherencia estadística → Reviewer.
- **Verificación**: France/Spain/Argentina > 10% en campeón, Haití < 1%.

### Fase 13 — Predicciones explícitas en fixture cards
- **Estado**: Completada (commit `151d246`).
- **Problema**: Las cards de partidos en el home solo muestran nombre de equipos y hora. Las predicciones están escondidas en la página de detalle.
- **Objetivo**: Mostrar en cada card del home el ganador predicho con probabilidad ("España gana · 64%") y los goles esperados ("2.3 goles"). Enlace "VER →" a la página de detalle (ya implementado).
- **Flujo harness**: Analyst define qué mercado mostrar y formato → Developer modifica `FixtureWithTeams` en `home-types.ts` para incluir predicciones pre-calculadas y actualiza `FixturesToday` → QA → Reviewer.


### Fase 14 — Sistema visual con agente Design
- **Estado**: Completada (PR #1). Base broadcast con tokens visuales, Outfit y acentos dorados.
- **Estado base**: La app ya tiene dirección broadcast/datos deportivos, pero ahora el trabajo fuerte será diseño. Antes de tocar UI se crea el agente `.claude/agents/design.md` y se vuelve parte del flujo de harness.
- **Objetivo**: Migrar la UI a una dirección visual más consistente, pensada para contenido: home, fixture detail, groups, market cards, estados vacíos, modo captura y responsive.
- **Criterios de diseño**:
  - Mantener el look de terminal deportiva/broadcast, con datos y probabilidades como protagonista.
  - Usar layout denso, escaneable y claro; evitar landing page, cards decorativas innecesarias y gradientes genéricos.
  - Definir tokens visuales en `app/globals.css`: color, tipografía, bordes, estados, escalas numéricas, espacios y barras de probabilidad.
  - Reutilizar componentes existentes (`Hero`, `FixturesToday`, `TopMarkets`, `Candidates`, `MarketSection`) antes de crear abstracciones nuevas.
  - Cuidar mobile primero: textos sin solaparse, botones legibles, cards con dimensiones estables y jerarquía clara.
- **Entregables**:
  - Agente `design` documentado en `.claude/agents/design.md`.
  - Checklist visual por pantalla: home, lista de partidos, detalle de partido, grupos y captura.
  - Refactor visual por componentes, sin cambiar contratos estadísticos.
  - Capturas o revisión manual de desktop/mobile antes de cerrar.
- **Flujo harness**: Design define dirección, tokens y checklist → Developer implementa componentes y CSS → QA corre build/tests y valida rutas principales → Design revisa fidelidad visual/responsive → Reviewer revisa harness/capas → Security revisa que no se introduzcan riesgos.
- **Verificación**: `pnpm build`, `pnpm test`, revisión responsive en home y detalle de partido, y Design aprobado sin bloqueantes.

### Fase 15 — Español LATAM y glosario de mercados
- **Estado**: Siguiente fase activa.
- **Spec**: `specs/phase-15-espanol-glosario/`.
- **Problema**: Hay textos mezclados y algunos mercados pueden ser confusos para usuarios que no conocen apuestas deportivas.
- **Objetivo**: Traducir toda la experiencia a español latinoamericano, con tono claro de análisis estadístico y sin prometer ganancias. Añadir botones de info para explicar cada tipo de mercado.
- **Alcance de traducción**:
  - Home, fixture cards, detalle de partido, grupos, candidatos, timestamps, estados vacíos y mensajes de error.
  - Mercados: 1X2, doble oportunidad, over/under, ambos marcan, marcador exacto, clean sheet, tarjetas, corners y goleadores.
  - Formatos regionales: fechas/horas para `es-CO` o `es-419`, porcentajes consistentes y nombres comprensibles.
- **Botón de info**:
  - Cada sección de mercado debe tener un icono o botón breve que abra tooltip, popover o panel compacto.
  - Las explicaciones deben ser neutrales: qué significa el mercado, cómo leer el porcentaje y qué tan confiable es el modelo.
  - Mantener visible el disclaimer de entretenimiento y evitar lenguaje de recomendación financiera.
- **Arquitectura sugerida**:
  - Crear un diccionario tipado de etiquetas y descripciones, por ejemplo `lib/content/markets-es.ts`.
  - UI consume textos desde ese diccionario; no duplicar strings en cada componente.
  - Si se agrega interactividad, aislarla en componentes client pequeños.
- **Flujo harness**: Design define patrón de info y microcopy visual → Analyst valida que las explicaciones de mercados sean correctas → Developer implementa diccionario y componentes → QA valida textos/rutas/build → Reviewer → Security.
- **Verificación**: No quedan strings críticos en inglés, el glosario cubre todos los mercados visibles, `pnpm test` y `pnpm build` pasan.

### Fase 16 — Goleadores y mercados extendidos por partido
- **Estado**: Completada (PR #7).
- **Spec**: `specs/phase-16-goleadores-mercados/`.
- **Problema**: La experiencia de partido todavía está corta para contenido: goleadores necesita más datos y hay mercados limitados más allá de tarjetas/corners.
- **Objetivo**: Enriquecer la página de detalle con predicciones de goleadores y más mercados derivados del modelo, manteniendo Vercel ISR y sin exponer llamadas/API keys al cliente.
- **Mercados candidatos**:
  - Goleador en cualquier momento, primer goleador y equipo del goleador.
  - Total de goles por equipo: local over 0.5/1.5/2.5 y visitante over 0.5/1.5/2.5.
  - Resultado + ambos marcan, resultado + over 1.5/2.5, gana a cero.
  - Handicap asiático simple o margen de victoria, si Analyst aprueba el contrato.
  - Corners por equipo y tarjetas por equipo cuando haya datos suficientes.
- **Datos de goleadores**:
  - Fuente preferida: API-Football player stats, lineups y minutos recientes cuando estén disponibles.
  - Fallback estático: tasas históricas/manuales por jugador, marcadas con confianza baja si faltan minutos o titularidad.
  - Nunca bloquear la página si no hay data de jugador: mostrar mercado no disponible o confianza baja.
- **Contrato de modelo**:
  - Analyst define inputs mínimos: jugador, equipo, minutos esperados, goles por 90, penales, probabilidad de titularidad y lambda del equipo.
  - Models derivan probabilidades sin red y con `sanityCheck`.
  - Agents/scripts precomputan y guardan la salida en JSON compatible con static export.
- **UI**:
  - Detalle de partido prioriza 3-5 mercados principales y deja el resto en secciones plegables.
  - Mostrar confianza (`alta`, `media`, `baja`) y explicación corta del porqué cuando aplique.
  - Mantener diseño apto para captura: números grandes, rankings claros, sin saturar.
- **Flujo harness**: Analyst define mercados y fórmulas → Design define jerarquía visual de mercados → Developer implementa skills/models/agents/UI → QA valida invariantes y build estático → Reviewer → Security.
- **Verificación**: Tests de nuevos modelos, fixture detail renderiza con y sin data de jugadores, `pnpm precompute`, `pnpm refresh-fixtures`, `pnpm test` y `pnpm build` pasan.


### Fase 17 — Probabilidades implícitas de casas de apuestas
- **Estado**: Pendiente.
- **Spec**: `specs/phase-17-odds-implicitas/`.
- **Problema**: El modelo propio genera probabilidades pero el usuario no tiene contexto de si son altas o bajas respecto al mercado. La comparación con las casas de apuestas es el hook viral más fuerte: "dónde discrepa la IA".
- **Objetivo**: Integrar probabilidades implícitas de bookmakers vía The Odds API (free tier: 500 req/mes) y mostrar junto a cada mercado el diferencial entre el modelo y el mercado.
- **Fuente**: [The Odds API](https://the-odds-api.com/) — free tier con fixture odds de las casas principales (Bet365, Pinnacle, etc.). Cubre 1X2 y over/under 2.5 como mínimo.
- **Arquitectura**:
  - Agent nuevo `lib/agents/odds-loader.ts`: llama The Odds API, normaliza odds a probabilidades implícitas (1/odd, con ajuste de overround) y guarda en `lib/data/odds-cache.json`.
  - Las odds son datos semi-estáticos (cambian poco salvo cerca del partido): cache ISR con `revalidate = 3600` es suficiente.
  - `lib/model/skills/value-calc.ts`: skill pura que recibe probabilidad del modelo y probabilidad implícita y devuelve el diferencial y un label (`VALOR+`, `VALOR-`, `NEUTRO`).
  - UI: columna o badge secundario en `ProbabilityBar` o `MarketSection` mostrando la odd implícita y el diferencial.
- **Framing obligatorio**: Las probabilidades implícitas aparecen como referencia informativa, no como recomendación. El disclaimer de entretenimiento se mantiene prominente. El copy usa "mercado estima" o "consenso de bookmakers", nunca "apuesta a".
- **Alcance MVP**: Mercados 1X2 y O/U 2.5 por partido (los de mayor cobertura en The Odds API free). Los demás mercados se pueden agregar en una fase futura si hay interés.
- **Flujo harness**: Analyst define fórmula de conversión odd→probabilidad y ajuste de overround → Design define cómo mostrar el diferencial en la UI (badge, columna, color) → Developer implementa agent + skill + UI → QA valida conversiones y edge cases (odd = 1.01, odd = 100) → Reviewer → Security (API key server-side, nunca al cliente).
- **Verificación**: Odds implícitas suman ~1 antes del ajuste de overround; después del ajuste suman exactamente 1. Diferencial en rango [-1, 1]. `pnpm test` y `pnpm build` pasan.

### Fase 18 — Datos de jugadores enriquecidos (lineups + lesiones)
- **Estado**: Pendiente.
- **Spec**: `specs/phase-18-jugadores-lineups/`.
- **Problema**: Los mercados de goleadores tienen confianza `low` porque usan tasas históricas sin saber si el jugador juega. Un titular diferente puede cambiar completamente la distribución.
- **Objetivo**: Incorporar lineups confirmados (disponibles ~1h antes del partido) y datos de lesiones/suspensiones para elevar la confianza de los mercados de goleadores.
- **Fuente**: API-Football — endpoints `fixtures/lineups` y `injuries`. Ya usamos API-Football para fixtures; no agrega nueva dependencia.
- **Arquitectura**:
  - Agent `lib/agents/lineups-loader.ts`: llama `fixtures/lineups` cuando el partido está a menos de 2h. Si no hay lineup, retorna `null` y el modelo usa el fallback histórico.
  - Los lineups se guardan en `lib/data/lineups-cache.json` indexado por fixtureId.
  - `lib/model/scorers.ts` recibe el lineup como input opcional: si viene, filtra solo los titulares confirmados y recalcula probabilidades con `starterProbability = 1.0`; si no, usa la tasa histórica con `starterProbability = 0.8` (asume 80% de probabilidad de jugar).
  - Confidence: si hay lineup confirmado → `medium`; sin lineup → `low` (como hoy).
- **Refresh near-kickoff**: El ISR de 1h (`revalidate = 3600`) no es suficiente para datos que cambian 1h antes del partido. Opciones: (a) Vercel On-Demand Revalidation desde un webhook o cron externo, (b) botón "Actualizar lineups" en la UI que dispara un Server Action. Para MVP se usa el Server Action manual.
- **Lesiones y suspensiones**: Si el jugador aparece en el endpoint de `injuries` como duda o baja, `starterProbability` baja a 0.2 o 0.0. Esto mejora la precisión sin requerir datos de alineación confirmada.
- **UI**: En la sección GOLEADORES, el badge `DATOS LIMITADOS` desaparece cuando hay lineup confirmado. Se muestra un indicador pequeño "Alineación confirmada" con timestamp.
- **Flujo harness**: Analyst redefine contrato de `scorers.ts` con `starterProbability` como input → Developer agrega agent + actualiza skill + UI → QA valida casos: lineup completo, sin lineup, jugador lesionado → Reviewer → Security (API key server-side).
- **Verificación**: Con lineup confirmado, probabilidades de goleadores suman correctamente y la suma de `anytime_scorer` por equipo no supera 1. Tests para los tres estados (lineup, no lineup, lesionado). `pnpm test` y `pnpm build` pasan.

---

## Agentes y flujo de verificación

Cada fase se valida con estos agentes en secuencia. Se omiten los que no aplican, salvo QA, Reviewer y Security, que cierran siempre:

1. **Analyst** (si hay cambios de modelo o copy técnico): valida matemática, contratos, lambdas y explicaciones de mercados.
2. **Design** (si hay cambios de UI/copy visual): define dirección visual, jerarquía, responsive, estados vacíos y checklist de captura.
3. **Developer** (si hay cambios de código): implementa siguiendo harness.
4. **QA** (siempre): corre tests, valida sanity checks de outputs, rutas principales y build estático. Tests pasan = ✅.
5. **Design** (si hubo UI): revisa fidelidad visual, legibilidad, responsive y consistencia de componentes. Sin bloqueantes = ✅.
6. **Reviewer** (siempre): audita harness, capas, convenciones. Sin bloqueantes = ✅.
7. **Security** (siempre, crítico antes de Cloudflare/deploy): detección de vulns, exposure de secretos, OWASP. Sin CRÍTICO = ✅.

**Flujo modelo**: Analyst → Developer → QA → Reviewer → Security → Aprobado.

**Flujo diseño/UI**: Design → Developer → QA → Design → Reviewer → Security → Aprobado.

**Flujo mixto**: Analyst → Design → Developer → QA → Design → Reviewer → Security → Aprobado.

Si alguno reporta bloqueante: vuelve a Developer para arreglo, y luego se re-valida desde QA. Si el bloqueante cambia contrato estadístico, vuelve primero a Analyst. Si cambia dirección visual, vuelve primero a Design.

---

## Flujo Git y deploy

Como `main` está conectado a producción en Vercel, no se trabaja directo sobre `main` para fases nuevas. El flujo será **trunk based development con ramas cortas**: `main` sigue siendo el trunk estable, y cada fase vive en una rama temporal que se integra rápido mediante PR.

### Reglas de ramas
- `main` representa producción y debe estar siempre desplegable.
- Cada fase se implementa en una rama desde `main` actualizada.
- Nombres sugeridos:
  - `phase/17-odds-implicitas`
  - `phase/18-jugadores-lineups`
  - `fix/<descripcion-corta>` para arreglos pequeños.
- Las ramas deben ser chicas y durar poco: idealmente una fase o un sub-entregable claro.
- Si una fase crece demasiado, se divide en PRs verticales que no rompan producción.

### Flujo por fase
1. Crear rama desde `main`.
2. Ejecutar el flujo de agentes que aplique: Analyst/Design → Developer → QA → Design si hubo UI → Reviewer → Security.
3. Correr verificación local antes del PR: `pnpm test` y `pnpm build` como mínimo; `pnpm tsc --noEmit` si no queda cubierto por build.
4. Abrir PR hacia `main` usando `.github/pull_request_template.md`, con resumen, alcance, riesgos, screenshots si hubo UI y comandos ejecutados.
5. Esperar preview deployment de Vercel para probar la rama sin tocar producción.
6. Tú revisas el PR y el preview: funcionamiento, diseño, copy, datos y comportamiento mobile si aplica.
7. Solo después de tu aprobación se hace merge a `main`.
8. Vercel despliega producción desde `main`; si algo sale mal, rollback desde Vercel o revert del PR.

### Criterios para merge
- PR aprobado por ti.
- Template de PR completo, con secciones no aplicables marcadas explícitamente.
- Checks locales/CI verdes.
- QA sin fallos.
- Reviewer sin bloqueantes.
- Security sin críticos.
- Design aprobado si hubo cambios visuales o de copy.
- Preview de Vercel revisado cuando la fase toque UI, rutas, build, ISR o datos.

### Recomendaciones para proteger producción
- Activar branch protection en GitHub para `main`: bloquear pushes directos, requerir PR y checks verdes.
- Mantener Vercel desplegando producción solo desde `main`.
- Usar preview deployments de Vercel para todas las ramas/PRs.
- Evitar mezclar refactors grandes con cambios de producto en el mismo PR.
- Mantener feature flags simples para cambios riesgosos, o dejar rutas/mercados nuevos ocultos hasta que estén aprobados.
- Para datos precomputados, revisar el diff de JSON cuando cambien probabilidades o fixtures importantes.

---

## Riesgos

- **Límite API free**: como el refresh es manual y tiene guarda de frescura, tú controlas cada llamada y respetas los 100 req/día. Para data en vivo durante partidos hay que pasar a plan pago.
- **Calidad de predicciones**: Poisson es sólido para goles, más ruidoso para tarjetas/corners. Mostrar confianza baja en esos mercados.
- **Legal**: mientras la app solo muestre probabilidades y no reciba dinero, es análisis estadístico.
- **Vercel ISR**: cualquier fase nueva debe preservar `revalidate`, runtime server seguro y variables server-side sin prefijo `NEXT_PUBLIC_`.
- **Cloudflare**: queda como DNS/CDN externo si se usa, pero no debe inyectar scripts que rompan CSP o Next.js.
- **D1/Workers**: quedan como opción futura si se decide volver a Cloudflare runtime; no son parte del flujo actual.
- **Main ligado a producción**: ningún cambio de fase debe entrar directo a `main`; todo pasa por rama, PR, preview y aprobación humana antes del merge.
