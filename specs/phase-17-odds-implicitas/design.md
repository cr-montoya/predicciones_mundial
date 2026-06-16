# Design: Fase 17 - Probabilidades implicitas de casas de apuestas

## ADR

- [ADR 0001: Adopcion de The Odds API como proveedor de probabilidades de mercado](../../docs/adr/0001-the-odds-api-provider.md)

## Enfoque

Agregar una capa de referencia de mercado sin contaminar el modelo. Las odds externas no
deben cambiar las probabilidades de la IA; solo sirven para comparar y explicar discrepancias.

## Arquitectura propuesta

```
The Odds API
   -> lib/agents/odds-loader.ts
   -> normalizacion odds
   -> lib/data/odds-cache.json o cache ISR/server
   -> lib/model/skills/value-calc.ts
   -> UI de mercados
```

## Agent de odds

`lib/agents/odds-loader.ts` debe:

- Leer API key desde env server-side.
- Llamar The Odds API.
- Normalizar nombres/equipos/fixtures.
- Convertir odds decimales a probabilidades crudas.
- Ajustar overround por mercado.
- Retornar estructura tipada para UI/model skills.

## Skill pura de value

`lib/model/skills/value-calc.ts`:

```ts
interface ValueInput {
  modelProbability: number
  marketProbability: number
}

interface ValueOutput {
  diff: number
  label: 'VALOR+' | 'VALOR-' | 'NEUTRO'
}
```

Umbrales aprobados por Analyst (`VALUE_THRESHOLD = 0.08`):

- `VALOR+`: `diff >= 0.08`.
- `VALOR-`: `diff <= -0.08`.
- `NEUTRO`: `-0.08 < diff < 0.08`.

Regla adicional: si `bookmakerCount < 2`, no emitir label de valor (mostrar sin etiqueta).
El umbral ±0.05 fue descartado por estar por debajo del ruido combinado del modelo (~10 pp) y del overround (4-8%).
Definir el umbral como constante nombrada para facilitar ajustes futuros.

## Overround

Para mercado con probabilidades crudas:

```txt
raw_i = 1 / decimalOdd_i
overround = sum(raw_i)
adjusted_i = raw_i / overround
```

Despues del ajuste, el mercado debe sumar 1.0. Antes del ajuste, la suma es el overround (tipicamente 1.04–1.08), no ~1.

**Los dos mercados se normalizan por separado**: 1X2 normaliza sus 3 outcomes, O/U normaliza sus 2. No mezclar los cinco campos en una sola normalizacion.

Guards obligatorios en el agent:
- `decimalOdd > 1.0` — odd decimal siempre mayor a 1; si llega <= 1.0, descartar y retornar `null`.
- `overround > 0` — evitar division por cero; si es 0 retornar `null`.

## UI

### Componente: fila de referencia subordinada

Renderizar una **fila de referencia debajo del `ProbabilityBar`** para cada outcome de los mercados MVP (los 3 outcomes de 1X2 y los 2 de O/U 2.5). Estructura por outcome:

```
[ProbabilityBar — IA 54%]          ← existente, sin cambios
└ Mercado 47%  ·  IA +7 pp  [VALOR+]   ← fila nueva, text-xs
```

- Flex row, `text-xs`, margin-top ~4px, sin card ni borde ni fondo.
- "Mercado" y numero en `tabular-nums`, color `var(--muted)` para la palabra y `#9a9ca3` para el numero.
- Diferencial en `tabular-nums`: `IA +7 pp` / `IA -4 pp` / `IA 0 pp`.
- Pill de VALOR con geometria de badge de confianza: `fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3, letterSpacing: 1`.
- Componente nuevo: `components/market-reference.tsx`, solo se usa en `market-section.tsx` para los 2 mercados MVP.

### Sistema de colores para etiquetas VALOR

Paleta sobre fondo oscuro. NO usar verde/rojo (evitar semantica apuesta/peligro):

- `VALOR+`: `bg: rgba(255,219,0,0.12)`, `color: #FFDB00` (gold, token `--accent`).
- `VALOR-`: `bg: rgba(212,168,67,0.10)`, `color: #D4A843` (amber, token `--accent2`).
- `NEUTRO`: `bg: rgba(255,255,255,0.06)`, `color: #6b6d75` (muted, igual que badge BAJA).

### Estados

- **Con odds disponibles**: fila de referencia con mercado %, diferencial y pill de VALOR (si `bookmakerCount >= 2`).
- **Sin odds (`OddsResult null`)**: una linea muted `Sin referencia de mercado` solo en mercados MVP. Reservar la misma altura para estabilidad visual.
- **Mercados fuera de MVP**: no renderizar nada, sin placeholder.

### Copy aprobado

- Titulo de seccion (si se agrupa): `REFERENCIA DE MERCADO`
- Estimacion del mercado: `Mercado {pct}%` (ej: `Mercado 47%`)
- Diferencial: `IA +7 pp`, `IA -4 pp`, `IA 0 pp`
- Etiquetas internas: `VALOR+`, `VALOR-`, `NEUTRO`
- Placeholder: `Sin referencia de mercado`
- Microcopy opcional en popover: `Promedio de {n} casas`
- Disclaimer: reusar `DisclaimerBanner` existente. No agregar un segundo disclaimer.

### Mobile

La fila es `text-xs` en flujo natural bajo la barra: apila sin intervencion. Usar `flex flex-wrap items-center gap-x-2 gap-y-1`. El diferencial permanece visible en mobile (es el hook). El microcopy de bookmakerCount puede omitirse en mobile (solo vive en popover).

### NO usar

- Verde/rojo en labels VALOR (semantica apuesta/peligro).
- "Apuesta", "apostar", "pick", "seguro", "garantizado", "value bet", "EV+", "books", "consenso".
- Odds decimales crudas en UI (solo probabilidad en %).
- Segundo banner de disclaimer.
- Card con borde/fondo para la comparacion.
- Animaciones o reveals por hover en el diferencial.
- Logos o nombres de bookmakers.

## Datos y cache

The Odds API free tier es limitado. Estrategias:

- Cachear por fixture/mercado.
- Revalidar como maximo cada hora.
- No llamar API desde client.
- Si no hay odds, mostrar "sin referencia de mercado".

## Data Contract: OddsLoader

### Owner Layer

Agent (`lib/agents/odds-loader.ts`)

### Source

- Provider: The Odds API (`https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds`)
- Runtime: Next.js server (nunca client)
- Cache/ISR: `next/cache` con `revalidate: 3600` (1 hora por fixture)

### Input Shape

```ts
// Parametros de llamada al agent
interface OddsLoaderInput {
  homeTeam: string   // nombre normalizado del equipo local
  awayTeam: string   // nombre normalizado del equipo visitante
  commenceTime?: string  // ISO 8601, para filtrar por fecha
}
```

### Output Shape

```ts
interface MarketOdds {
  homeWin: number       // probabilidad ajustada [0, 1]
  draw: number          // probabilidad ajustada [0, 1], solo en 1X2
  awayWin: number       // probabilidad ajustada [0, 1]
  over25: number | null // probabilidad ajustada [0, 1], null si no aplica
  under25: number | null
  bookmakerCount: number
  fetchedAt: string     // ISO 8601
}

// null cuando no hay odds disponibles para el partido
type OddsResult = MarketOdds | null
```

```ts
// Forma raw de The Odds API (solo campos relevantes)
interface OddsAPIResponse {
  id: string
  home_team: string
  away_team: string
  commence_time: string
  bookmakers: Array<{
    key: string
    markets: Array<{
      key: 'h2h' | 'totals'
      outcomes: Array<{
        name: string   // equipo o "Over"/"Under"
        price: number  // odd decimal
        point?: number // linea (ej: 2.5 para O/U)
      }>
    }>
  }>
}
```

### Nullability y Fallbacks

- Si la API no responde (timeout, error HTTP): retornar `null`, no lanzar excepcion.
- Si no hay bookmakers para el partido: retornar `null`.
- Si solo hay datos de `h2h` pero no de `totals`: retornar odds parciales con `over25: null`.
- UI debe manejar `null` mostrando "Sin referencia de mercado".

### Errors

- HTTP 401/403: API key invalida o expirada — loguear en server, retornar `null`.
- HTTP 429: cuota agotada — loguear con timestamp, retornar `null`, no reintentar.
- HTTP 5xx: error del proveedor — retornar `null`.
- Timeout > 3000ms: retornar `null`.

### Security

- Secrets: `THE_ODDS_API_KEY` en Vercel env vars, nunca en `.env.local` commiteado.
- Client exposure: ninguna. Solo el agent llama la API.
- Quotas: 500 req/mes free tier. Cache 1h reduce llamadas a max ~64 por partido.

### Validation

- `sum(homeWin + draw + awayWin)` debe ser exactamente 1.0 post-overround.
- `sum(over25 + under25)` debe ser exactamente 1.0 si ambos existen.
- Cada probabilidad ajustada debe estar en `[0, 1]`.
- `diff` en `ValueOutput` debe estar en `[-1, 1]`.
- Tests unitarios en `lib/model/skills/__tests__/value-calc.test.ts`.

## Data Contract: ValueCalc

### Owner Layer

Skill (`lib/model/skills/value-calc.ts`)

### Input Shape

```ts
interface ValueInput {
  modelProbability: number    // [0, 1] — del modelo Poisson propio
  marketProbability: number   // [0, 1] — de OddsResult ajustado
}
```

### Output Shape

```ts
interface ValueOutput {
  diff: number                        // modelProbability - marketProbability, rango [-1, 1]
  label: 'VALOR+' | 'VALOR-' | 'NEUTRO'
}
```

### Nullability y Fallbacks

- Si `marketProbability` es `null` o `undefined`: no llamar la skill; la UI muestra estado vacio.
- La skill es pura: nunca recibe `null` directamente; el caller filtra antes.

### Validation

- Umbrales aprobados: `VALOR+ >= 0.08`, `VALOR- <= -0.08`, `NEUTRO` en entre medio.
- `bookmakerCount >= 2` para emitir label; con una sola casa, sin etiqueta.
- Sanity checks known-good (odds Brasil vs Mexico):
  - Odds 1X2: [1.80, 3.60, 4.50] → raw [0.556, 0.278, 0.222] → overround 1.056 → adjusted [0.526, 0.263, 0.211] → suma 1.000
  - Odds O/U: [1.95, 1.90] → raw [0.513, 0.526] → overround 1.039 → adjusted [0.494, 0.506] → suma 1.000
  - Value: modelProb=0.62, marketProb=0.526 → diff=+0.094 → VALOR+
  - Value: modelProb=0.40, marketProb=0.526 → diff=-0.126 → VALOR-
  - Value: modelProb=0.56, marketProb=0.526 → diff=+0.034 → NEUTRO
- Edge cases: odd <= 1.0 → null; overround = 0 → null; diff exacto ±0.08 → limite inclusivo en VALOR; bookmakerCount < 2 → sin label.

---

## Riesgos

### Matching de equipos

Bookmakers pueden usar nombres distintos a los providers.

Mitigacion: normalizador de nombres y fallback manual si hace falta.

### Cuota de API

500 req/mes puede agotarse rapido.

Mitigacion: limitar a partidos proximos y mercados MVP.

### Percepcion de asesoría

Comparar con books puede sonar a recomendacion.

Mitigacion: copy informativo y disclaimer prominente.
