---
status: active
phase:
owner: cristian
branch: fix/flags-display
pr:
preview:
gates:
  spec_review: not_applicable
  grill: not_applicable
  analyst: not_applicable
  design: passed
  data_contract: not_applicable
  security: not_applicable
  qa: pending
  code_quality: not_applicable
  reviewer: pending
---

# fix-flags-display — Requirements

## Status

active

## Objective

Corregir dos problemas de visualización de banderas en la app:

1. **Jugadores con bandera**: los candidatos a la Bota de Oro muestran la bandera de
   su país junto al nombre. Los jugadores no deben tener bandera; la bandera aplica
   solo a equipos/selecciones.
2. **Países sin bandera**: Cabo Verde (Cape Verde Islands), Jordan y Congo DR aparecen
   sin bandera porque sus nombres en `teams-seed.ts` no coinciden con las entradas de
   `lib/utils/flags.ts` o directamente no existen.

## Contexto

`lib/utils/flags.ts` define el mapa `FLAGS` que incluye tanto nombres de selecciones
como nombres de jugadores individuales (Mbappé, Messi, Ronaldo, etc.).

El componente `components/candidates.tsx` llama `getFlag(name)` con el nombre del
jugador para mostrar la bandera en la sección "Candidatos a Bota de Oro". Esto hace
que jugadores conocidos muestren la bandera de su país, lo que es incorrecto: el ranking
es de jugadores individuales, no de selecciones.

Respecto a los países sin bandera, el nombre canónico en `teams-seed.ts` es:
- `"Cape Verde Islands"` → FLAGS tiene `"Cape Verde"` (mismatch)
- `"Jordan"` → no existe en FLAGS
- `"Congo DR"` → no existe en FLAGS

## Scope

- Eliminar todas las entradas de jugadores individuales del mapa FLAGS en
  `lib/utils/flags.ts`.
- Agregar entrada `"Cape Verde Islands": '🇨🇻'` a FLAGS (o corregir la existente).
- Agregar entrada `"Jordan": '🇯🇴'` a FLAGS.
- Agregar entrada `"Congo DR": '🇨🇩'` a FLAGS.

## Out of Scope

- Cambiar la lógica de cómo se muestra la bandera en `candidates.tsx` (solo se
  beneficia del fix al eliminar entradas de jugadores en FLAGS).
- Agregar banderas a componentes que hoy no las muestran.
- Arreglar nombres de equipos en otras partes del código.

## Requirements

1. Ningún jugador individual aparece con bandera en la sección "Candidatos a Bota
   de Oro" de la home.
2. Cabo Verde (Cape Verde Islands), Jordan y Congo DR muestran su bandera correcta
   en la tabla de grupos y en la lista de fixtures.
3. El resto de las banderas existentes no se ven afectadas.

## Acceptance Criteria

- [ ] Candidatos a Bota de Oro: ningún jugador muestra bandera.
- [ ] Tabla de grupos grupo H: Cape Verde Islands muestra 🇨🇻.
- [ ] Tabla de grupos grupo J: Jordan muestra 🇯🇴.
- [ ] Tabla de grupos grupo K: Congo DR muestra 🇨🇩.
- [ ] `pnpm tsc --noEmit` pasa.
- [ ] `pnpm test` pasa.

## Risks and Assumptions

- Eliminar las entradas de jugadores de FLAGS no afecta nada más; `candidates.tsx`
  simplemente no renderizará el `<span>` de bandera cuando `flag` sea `''`.
- Si en el futuro se quiere agregar banderas a jugadores, se debe hacer desde el
  componente que los muestra (pasando el teamId del jugador), no desde FLAGS.
