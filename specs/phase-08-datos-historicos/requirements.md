# Requirements: Fase 8 - Datos historicos

## Estado

Completada.

## Objetivo

Calibrar fuerzas de equipos con datos historicos para evitar probabilidades uniformes.

## Requerimientos

1. Crear `lib/data/historical-stats.json`.
2. Incluir fuerza ofensiva y defensiva por equipo.
3. Usar competiciones recientes y relevantes.
4. Integrar stats historicos en recomputo de fuerzas.
5. Mejorar distribucion de probabilidades de campeon.

## Criterios de éxito

1. Favoritos suben por encima de equipos debiles.
2. Equipos muy debiles quedan por debajo de 1%.
3. Tests de tournament prediction pasan.
