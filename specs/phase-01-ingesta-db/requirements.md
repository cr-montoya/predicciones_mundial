# Requirements: Fase 1 - Ingesta y DB

## Estado

Completada.

## Objetivo

Crear la capa de datos para fixtures, equipos, eventos, estadisticas y predicciones.

## Requerimientos

1. Debe existir schema para equipos, fixtures, eventos, stats y predicciones.
2. Debe existir provider de API-Football con retry/cache.
3. Debe existir fallback de football-data.org.
4. Debe existir seed de selecciones del Mundial 2026.
5. Los providers deben normalizar respuestas externas a tipos internos.
6. La UI no debe consumir respuestas crudas de APIs externas.

## Criterios de éxito

1. Los scripts locales pueden poblar datos base.
2. Los providers devuelven fixtures normalizados.
3. Tests de normalizacion pasan.
