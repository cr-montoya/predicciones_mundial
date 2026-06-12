# PREDICTOR MUNDIAL 2026 — IA

App que proyecta **todos los mercados estadísticos** de cada partido del Mundial 2026 (resultado, goles, tarjetas, goleadores, corners) con un modelo propio. Análisis de entretenimiento — solo muestra probabilidades, no recibe ni procesa apuestas.

## Stack

- **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind + shadcn/ui
- **Modelos**: Poisson, Monte Carlo + simulación en `lib/model/`
- **Data**: SQLite local (`data/mundial.db`) + API-Football (RapidAPI)
- **Refresh**: Manual bajo demanda — botón "Actualizar" en UI o `pnpm refresh`

## Setup

```bash
# Install
pnpm install

# Environment
cp .env.example .env.local
# Completa RAPIDAPI_KEY (obtén en https://rapidapi.com/api-sports/api/api-football)

# Dev
pnpm dev                    # localhost:3000

# Refresh
pnpm refresh                # Trae data y recalcula predicciones (o usa el botón en la UI)

# QA
pnpm test                   # Vitest
pnpm tsc --noEmit          # Type-check
pnpm lint                   # ESLint
pnpm build                  # Build de producción
```

## Arquitectura

Harness de capas sin importaciones cíclicas:

```
UI (Server/Client)  ←  Agents (I/O)  ←  Models (lógica)  ←  Skills (pure fn)
                        (DB write)
```

- **Skills** (`lib/model/skills/`): funciones puras, testeables sin mocks.
- **Models** (`lib/model/`): reciben data normalizada, devuelven `ModelOutput` con probabilidades que suman 1.0.
- **Agents** (`lib/agents/`, `app/actions/`): únicos que tocan API y DB. Registran cada corrida.
- **DB** (`lib/db/`): cliente SQLite. Schemas en `lib/db/schema.sql`.

## Cómo funciona

1. **Data**: Script o botón dispara `runRefresh()`, que trae fixtures de API-Football.
2. **Predicciones**: Para cada partido y mercado, el modelo Poisson estima lambdas (goles esperados) y simula 10k partidas. Las probabilidades se guardan con timestamp.
3. **Guarda de frescura**: No recalcula si la última corrida fue hace menos de N minutos (protege la cuota de API).
4. **UI**: Muestra predicciones, histórico, intervalo de confianza.

## Desarrollo

- Todos los cambios pasan por: `developer` → `pnpm test` + `pnpm tsc` → **reviewer** antes de merge.
- Si reportas un bug, especifica si es de **implementación** (bug en código) o de **lógica estadística** (distribución incorrecta, lambda fuera de rango). El flujo difiere.
- Lee [CLAUDE.md](CLAUDE.md) para detalles técnicos, convenciones y ciclo de corrección.

## Estructura de archivos

```
├── app/                    # Next.js app routes + Server Actions
├── lib/
│   ├── db/                 # SQLite client, schema, queries
│   ├── model/              # Modelos Poisson, Monte Carlo, markets
│   ├── agents/             # Refresh logic
│   ├── data/               # API-Football client
│   └── types.ts            # Tipos compartidos
├── public/                 # Assets
├── data/
│   └── mundial.db          # DB SQLite (gitignored)
├── CLAUDE.md               # Convenciones, harness, ciclo QA
└── .env.example            # Template de env vars
```

## License

Entretenimiento. Sin ánimo de lucro.