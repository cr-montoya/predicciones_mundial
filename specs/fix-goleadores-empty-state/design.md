# fix-goleadores-empty-state — Design

## Context

`computePredictionsForFixture` en `lib/agents/live-loader.ts` llama `computeMatchOutputs`
con `homePlayers: []` y `awayPlayers: []`. El modelo de scorers detecta que no hay jugadores
elegibles y retorna `emptyOutput` con `probabilities: {}`. La fixture page siempre incluye
los scorer markets en `scorerMarkets`, así que la sección GOLEADORES siempre se renderiza,
incluso vacía.

## Architecture

- **UI** (`app/fixtures/[id]/page.tsx`): filtrar `scorerMarkets` antes de renderizar.
- Ninguna otra capa se toca.

## Fix

En `app/fixtures/[id]/page.tsx`, después de extraer `scorerMarkets`, filtrar los que tengan
al menos un outcome:

```ts
const scorerMarkets = pickMarkets(predictions, ['anytime_scorer', 'first_scorer'])
  .filter(m => Object.keys(m.probabilities).length > 0)
```

Si el array resultante está vacío, `MarketSection` ya retorna `null` por su propia lógica
(`if (markets.length === 0) return null`). El `CollapsibleSection` tampoco se renderiza
porque está condicionado a `scorerMarkets.length > 0` (implícito en el flujo actual).

Verificar que el `CollapsibleSection` de GOLEADORES esté condicionado:

```tsx
{scorerMarkets.length > 0 && (
  <FadeIn delay={0.25}>
    <CollapsibleSection title="GOLEADORES" ...>
      ...
    </CollapsibleSection>
  </FadeIn>
)}
```

Si no está condicionado, agregar la guarda.

## UX

- Sin datos: la sección GOLEADORES simplemente no aparece. No hay empty state ni placeholder.
- Con datos: comportamiento actual, incluyendo badge "DATOS LIMITADOS" cuando `confidence === 'low'`.

## Testing Strategy

- `pnpm tsc --noEmit`
- `pnpm test` — los tests existentes no deben verse afectados
- Verificar en preview de Vercel que la sección desaparece en partidos sin lineup
