---
status: in_review
phase: 25
owner: cristian
branch: phase/25-match-context

pr:
preview:
gates:
  spec_review: passed
  grill: passed
  analyst: passed
  design: passed
  data_contract: passed
  security: not_applicable
  qa: passed
  code_quality: passed
  reviewer: passed
---

# phase-25-match-context — Requirements

## Status

in_review

## Objective

Mostrar contexto pre-partido en la página de cada fixture: los últimos resultados
de cada equipo en el torneo y el historial head-to-head entre ambos. Hace que la
predicción se sienta más fundamentada y da al usuario más motivos para leer antes
de apostar su opinión.

## Contexto

La página de fixture hoy muestra directamente probabilidades y mercados, pero no
hay contexto narrativo. Un usuario que llega sin saber nada de los equipos no tiene
forma de calibrar la predicción. El contexto de forma reciente y H2H es el estándar
en cualquier análisis deportivo.

Los datos de forma reciente dentro del torneo están disponibles en los fixtures ya
cargados (`loadFixtures()`). El H2H histórico requeriría una llamada adicional a
football-data.org (`/teams/{id}/matches`) — esto se puede limitar a partidos de
Mundiales anteriores usando el parámetro `competitions=WC`.

## Scope

- Sección "CONTEXTO" en `app/fixtures/[id]/page.tsx` encima de los mercados.
- **Forma en el torneo**: últimos N partidos del Mundial 2026 de cada equipo
  (W/D/L badges), solo si ya jugaron algún partido.
- **Encuentros en este Mundial**: partidos entre los dos equipos en el WC 2026,
  desde football-data.org (`/teams/{id}/matches?competitions=WC`).
  - Si la llamada falla o no hay datos: omitir la subsección silenciosamente.
  - Nota de diseño: en fase de grupos los equipos aún no se han cruzado →
    subsección H2H se omite. Útil principalmente en octavos en adelante.
- Ambas subsecciones son opcionales: si un equipo no ha jugado aún y no hay H2H,
  la sección "CONTEXTO" no se renderiza.

## Out of Scope

- Forma fuera del torneo (ligas nacionales, amistosos).
- Stats avanzadas del torneo (posesión, tiros, etc.).
- Contexto narrativo generado por IA (texto automático).
- Lesiones o ausencias (requiere API-Football con lineup data — fase 18).

## Requirements

1. La sección de forma muestra los partidos ya jugados del torneo para cada equipo,
   con badge W/D/L y marcador.
2. La sección H2H muestra los últimos enfrentamientos en Mundiales anteriores, si
   están disponibles.
3. Si no hay datos de contexto, la sección no se renderiza.
4. La llamada H2H tiene un timeout o fallback silencioso para no bloquear el render
   de la página si el API no responde.
5. Los datos de forma se derivan de fixtures ya cargados (sin llamada extra).

## Decisión de diseño: scope del H2H

El endpoint `/teams/{id}/matches?competitions=WC` devuelve solo la temporada activa
(WC 2026). Se decidió acotar el H2H a "encuentros en este Mundial" en lugar de
consultar temporadas anteriores (WC 2022, 2018) con múltiples llamadas adicionales.
La subsección H2H se omite silenciosamente cuando no hay encuentros (fase de grupos).

## Acceptance Criteria

- [ ] Fixture entre dos equipos que ya jugaron: muestra forma de ambos.
- [ ] H2H: si hay datos (encuentros previos en WC 2026), se muestran hasta 5 partidos con fecha y resultado.
- [ ] H2H: si la llamada falla, la sección se omite sin error visible.
- [ ] Fixture entre dos equipos sin partidos previos: sección CONTEXTO oculta.
- [ ] `pnpm tsc --noEmit` pasa.

## Risks and Assumptions

- La llamada H2H agrega latencia a la página. Debe correr con `Promise.race` o
  timeout de ~2s para no degradar el TTI del fixture.
- football-data.org puede limitar el H2H por plan de API. Si no está disponible
  en el plan actual, el H2H se marca como `deferred` y solo se muestra la forma.
- "Forma en el torneo" tiene datos limitados en la primera jornada (un partido
  por equipo). El diseño debe funcionar bien con 1, 2 o 3 partidos mostrados.
