# Requirements: Fase 12 - Datos historicos enriquecidos

## Estado

Completada.

## Objetivo

Enriquecer `historical-stats.json` para diferenciar mejor selecciones de fuerza similar.

## Requerimientos

1. Agregar competiciones y años adicionales.
2. Evaluar ponderacion por tipo de competicion.
3. Mantener contrato de `computeStrengths`.
4. Validar que favoritos mejoren probabilidad.
5. Evitar que equipos debiles queden sobreponderados.

## Criterios de éxito

1. France/Spain/Argentina suben respecto a baseline.
2. Haiti queda por debajo de 1%.
3. Tests estadisticos pasan.
