# Requirements: Fase 2 - Modelo de prediccion

## Estado

Completada.

## Objetivo

Implementar el modelo estadistico base para proyectar mercados de partido y torneo.

## Requerimientos

1. Debe existir distribucion Poisson para goles esperados.
2. Debe existir matriz de marcador exacto.
3. Deben derivarse mercados 1X2, over/under, BTTS y marcador exacto.
4. Deben existir modelos de tarjetas, corners, goleadores y Monte Carlo.
5. Los modelos deben ser puros respecto a red/DB.
6. Las probabilidades deben pasar sanity checks.

## Criterios de éxito

1. Probabilidades suman 1.0 donde aplique.
2. Tests de skills/modelos pasan.
3. Inputs fuertes producen resultados estadisticamente coherentes.
