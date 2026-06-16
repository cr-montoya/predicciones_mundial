# ADR 0001: Adopcion de The Odds API como proveedor de probabilidades de mercado

## Status

proposed

## Context

La fase 17 requiere probabilidades implicitas de bookmakers para mostrar el diferencial
entre el modelo propio y el consenso del mercado. Se evaluaron tres opciones:

1. **The Odds API** — API SaaS con free tier de 500 req/mes, endpoints para H2H (1X2)
   y totals (Over/Under), multiples bookmakers agregados, formato decimal estandar.
2. **Scraping directo de odds** — sin costo pero violacion de TOS, fragil, riesgo legal.
3. **Datos estaticos manuales** — sin dependencia externa pero requiere actualizacion
   manual antes de cada partido; no escala con 64 partidos del Mundial.

Restricciones:
- API key debe permanecer server-side (nunca NEXT_PUBLIC_).
- Free tier de 500 req/mes limita las llamadas; el Mundial tiene 64 partidos con
  potencialmente multiples mercados cada uno.
- El modelo propio no debe ser afectado por las odds externas: son solo referencia.
- El sistema debe degradar limpiamente si no hay odds disponibles.

## Decision

Adoptar The Odds API como unico proveedor de odds externas para la fase MVP.

- Mercados cubiertos: `h2h` (1X2) y `totals` (Over/Under 2.5).
- Odds en formato decimal, normalizadas a probabilidades implicitas con ajuste de overround.
- Agent `lib/agents/odds-loader.ts` es la unica capa autorizada para llamar la API.
- Cache ISR de hasta 1 hora por fixture para no agotar la cuota.
- Fallback a `null` (sin datos de mercado) si la API no responde o no tiene odds.
- Nombre de equipos normalizado via mapa estatico inicial; fallback por substring match.

## Consequences

### Positive

- Datos de mercado reales, actualizados, de multiples bookmakers agregados.
- Formato decimal estandar facilita la formula de overround.
- Aislamiento completo en el agent: Skills y UI no dependen de la API.
- Degradacion limpia garantizada por contrato del agent.

### Negative

- Cuota free de 500 req/mes puede agotarse en fase de torneo activo si no se cachea bien.
- Matching de nombres de equipos puede fallar para selecciones con nombres alternativos
  (por ej. "USA" vs "United States" vs "Estados Unidos").
- Odds pueden no estar disponibles para partidos muy anticipados o sin linea abierta.

### Neutral / Follow-up

- Si la cuota se agota, evaluar upgrade de plan o reduccion de mercados consultados.
- Mapa de normalizacion de nombres debe mantenerse conforme avanza el torneo.
- Si surge un segundo proveedor mejor, este ADR se supersede con 0002.

## Related

- Spec: specs/phase-17-odds-implicitas/
- PR: (pendiente)
