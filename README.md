# Predictor Mundial 2026 — IA

App en Next.js para proyectar mercados estadísticos del Mundial 2026 con un
modelo propio. El framing del producto es: **"así predice la IA el Mundial"**.

Es una experiencia de análisis y entretenimiento: muestra probabilidades,
contexto y explicaciones; no recibe apuestas, no procesa apuestas y no promete
ganancias.

## Estado actual

- Producción en **Vercel** con ISR.
- `main` despliega producción.
- Cada PR genera preview en Vercel.
- Fixtures en runtime server desde `football-data.org` con `FOOTBALLDATA_KEY`.
- API-Football/RapidAPI queda como fuente enriquecida para lineups, injuries,
  eventos, stats y fallback cuando aplique.
- Monte Carlo del torneo precomputado en `lib/data/tournament-prediction.json`.
- SQLite/better-sqlite3 se conserva para scripts locales e historia del proyecto,
  pero no debe entrar al runtime de Vercel.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest
- Vercel ISR
- Modelo propio con Poisson, derivación de mercados y Monte Carlo

## Setup local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Variables relevantes:

```txt
FOOTBALLDATA_KEY=<server-side only>
RAPIDAPI_KEY=<server-side only, si se usa API-Football>
```

No expongas secrets con `NEXT_PUBLIC_`.

## Comandos

```bash
pnpm dev
pnpm test
pnpm tsc --noEmit
pnpm build
pnpm precompute
pnpm refresh-fixtures
pnpm refresh
```

Notas:

- `pnpm precompute` regenera la predicción de torneo.
- `pnpm refresh-fixtures` actualiza fixtures/cache local.
- `pnpm refresh` pertenece al flujo histórico/local de refresh.
- Para producción, el runtime vigente es Vercel ISR.

## Arquitectura

El proyecto usa un harness de capas. Las dependencias van en una sola dirección:

```txt
UI  <-  Agents  <-  Models  <-  Skills
      (I/O)       (math)      (pure fn)
```

- **Skills**: funciones puras en `lib/model/skills/`, sin red, DB, env vars ni
  estado global.
- **Models**: lógica estadística en `lib/model/`; reciben datos normalizados y
  devuelven contratos verificables.
- **Agents**: loaders, providers y scripts en `lib/agents/` y `lib/data/`; son la
  capa autorizada para API externa, env vars server-side y cache runtime.
- **UI**: rutas y componentes en `app/` y `components/`; consume datos listos
  desde server loaders.

## Producto

Mercados y secciones actuales o planificadas:

- Resultado 1X2
- Doble oportunidad
- Over/Under goles
- Ambos marcan
- Marcador exacto
- Clean sheet / gana a cero
- Tarjetas y corners
- Goleadores
- Proyección de grupos
- Campeón y torneo vía Monte Carlo
- Odds implícitas y datos de jugadores enriquecidos como próximas fases

## Flujo de trabajo

Este repo trabaja con Spec Driven Development y trunk-based development:

1. Crear rama corta desde `main`: `phase/<numero>-<descripcion>` o `fix/<descripcion>`.
2. Crear o actualizar spec en `specs/<nombre>/`.
3. Mantener actualizado `specs/README.md`.
4. Implementar en PRs pequeños hacia `main`.
5. Revisar preview de Vercel antes de merge.
6. Mergear solo con aprobación humana.

Cada spec tiene:

```txt
specs/<nombre>/
  requirements.md
  design.md
  tasks.md
```

El flujo de harness combina skills y agentes:

```txt
spec-init
-> spec-review
-> data-contract / adr si aplica
-> grill
-> agentes pre-implementación
-> task-runner / developer
-> QA
-> Code Quality
-> Reviewer
-> Design/Security re-check si aplica
-> spec-closeout
-> grill re-check
-> pr-prep
-> commit
-> PR + Vercel preview
```

## Agentes y skills

Configuración en `.claude/`:

- `agents/analyst.md`: modelo, probabilidades, odds, lineups y copy técnico.
- `agents/design.md`: UI, responsive, jerarquía visual y copy visual.
- `agents/developer.md`: implementación siguiendo specs y harness.
- `agents/qa.md`: tests, type-check, build y smoke de rutas.
- `agents/code-quality.md`: buenas prácticas, mantenibilidad, typing y simplicidad.
- `agents/reviewer.md`: harness, capas y consistencia spec-implementación.
- `agents/security.md`: secrets, CSP, APIs, runtime y exposición de datos.
- `skills/*`: flujo SDD, grill, PR prep y commits estándar.

Más detalle en:

- `CLAUDE.md`
- `.claude/README.md`
- `specs/README.md`
- `plan.md`

## Estructura

```txt
app/                    Next.js App Router
components/             Componentes UI reutilizables
lib/agents/             Loaders y orquestación server-side
lib/data/               Providers, JSON versionados y cache local
lib/model/              Modelo estadístico y Monte Carlo
lib/model/skills/       Funciones puras del modelo
lib/db/                 SQLite local/histórico y scripts relacionados
lib/content/            Copy y diccionarios de mercados
scripts/                Scripts locales de seed, refresh y precompute
specs/                  Specs SDD por fase o fix
.claude/                Agentes, skills y flujo operativo
.github/                Template de PR
```

## Deploy

La arquitectura vigente es Vercel ISR. Las referencias a Cloudflare/D1 se
conservan como historia técnica y contexto, pero no representan el runtime actual.

Checklist de deploy/PR:

- `pnpm tsc --noEmit`
- `pnpm test`
- `pnpm build`
- Spec enlazada
- `specs/README.md` actualizado si aplica
- PR template completo
- Preview de Vercel revisado si toca UI, rutas, runtime, ISR o datos

## Licencia

Proyecto de entretenimiento y análisis estadístico. Sin ánimo de lucro.
