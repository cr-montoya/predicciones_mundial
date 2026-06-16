# Design: Fase 17 - Probabilidades implicitas de casas de apuestas

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

Regla inicial sugerida:

- `VALOR+`: `diff >= 0.05`.
- `VALOR-`: `diff <= -0.05`.
- `NEUTRO`: rango intermedio.

Analyst debe validar umbrales.

## Overround

Para mercado con probabilidades crudas:

```txt
raw_i = 1 / decimalOdd_i
overround = sum(raw_i)
adjusted_i = raw_i / overround
```

Despues del ajuste, el mercado debe sumar 1.0.

## UI

Opciones recomendadas:

- Badge secundario junto a `ProbabilityBar`.
- Columna compacta en `MarketSection`.
- Copy: "Mercado estima X%" o "Consenso books X%".
- Diferencial: `IA +7 pp` o `IA -4 pp`.

Evitar:

- "Apuesta".
- "Pick".
- "Seguro".
- "Garantizado".

## Datos y cache

The Odds API free tier es limitado. Estrategias:

- Cachear por fixture/mercado.
- Revalidar como maximo cada hora.
- No llamar API desde client.
- Si no hay odds, mostrar "sin referencia de mercado".

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
