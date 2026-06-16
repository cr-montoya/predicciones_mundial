# Design: Fase 15 — Español LATAM y glosario de mercados

## Enfoque

Centralizar el lenguaje de mercados en un diccionario tipado y hacer que la UI consuma
ese contenido desde un solo lugar. La fase debe mejorar comprensión sin meter ruido visual:
la app sigue siendo una terminal broadcast, no una pantalla de ayuda.

## Arquitectura propuesta

```
lib/content/markets-es.ts
   -> labels, descripciones, ejemplos, limitaciones

components/market-info.tsx
   -> boton/info reutilizable

components/market-section.tsx
components/top-markets.tsx
app/fixtures/[id]/page.tsx
   -> consumen getMarketCopy(market)
```

## Diccionario de mercados

Crear un contrato tipo:

```ts
export interface MarketCopy {
  label: string
  shortLabel: string
  description: string
  example: string
  confidenceNote?: string
}

export type MarketCopyKey =
  | 'result_1x2'
  | 'double_chance'
  | 'over_under_goals'
  | 'btts'
  | 'exact_score'
  | 'clean_sheet'
  | 'cards'
  | 'corners'
  | 'scorers'
```

El diccionario debe cubrir los mercados actuales aunque algunos todavía no estén visibles.
Esto evita re-trabajo en Fase 16.

## Copy base sugerido

- `1X2`: Resultado del partido.
- `Doble oportunidad`: Dos resultados cubiertos en una misma lectura.
- `Más/Menos goles`: Probabilidad de que el partido supere o no una línea de goles.
- `Ambos marcan`: Probabilidad de que los dos equipos anoten al menos un gol.
- `Marcador exacto`: Marcadores más probables según la matriz Poisson.
- `Gana a cero`: Equipo gana y no recibe goles.
- `Tarjetas`: Estimación de disciplina; confianza usualmente más baja.
- `Corners`: Estimación de tiros de esquina; depende mucho del estilo del partido.
- `Goleadores`: Probabilidad asociada a jugadores, minutos esperados y lambda del equipo.

## Componente de info

El patrón recomendado:

- Botón con icono `i` o `?` pequeño.
- En desktop: popover/tooltip junto al título del mercado.
- En mobile: panel compacto debajo del header de sección o dialog ligero si ya existe patrón.
- Cerrar con click fuera o botón.
- Sin texto largo visible por defecto.

## Formato y localización

Crear helpers si hace falta:

- `formatPercent(value)`.
- `formatLocalTime(iso, locale = 'es-CO')`.
- `formatLocalDate(iso, locale = 'es-CO')`.

Evitar formatos mezclados dentro de componentes.

## UX y diseño

- Mantener jerarquía de datos: primero probabilidad, luego explicación.
- El info button no debe competir con el número principal.
- Las explicaciones deben ser de 1-3 frases.
- No usar lenguaje tipo "apuesta segura", "garantizado" o "recomendado".
- Mantener disclaimer de entretenimiento visible.

## Impacto esperado

Archivos probables:

- `lib/content/markets-es.ts`
- `components/market-info.tsx`
- `components/market-section.tsx`
- `components/top-markets.tsx`
- `components/fixtures-today.tsx`
- `components/candidates.tsx`
- `app/fixtures/page.tsx`
- `app/fixtures/[id]/page.tsx`
- `app/groups/page.tsx`

## Riesgos

### Client components innecesarios

El popover puede forzar `"use client"` en componentes grandes.

Mitigación: aislar interactividad en `MarketInfo`.

### Copy demasiado largo

Puede romper el layout mobile.

Mitigación: copy compacto, truncado visual controlado y revisión responsive.

### Traducción incompleta

Pueden quedar strings sueltos en inglés.

Mitigación: QA con búsqueda por strings conocidos: `Over`, `Under`, `Draw`, `Home`,
`Away`, `BTTS`, `Clean sheet`, `Winner`.
