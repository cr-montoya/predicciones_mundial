# Design: Fase 13 - Predicciones en fixture cards

## Datos

`FixtureWithTeams` incluye un campo `prediction` con:

- `winner`.
- `winnerProb`.
- `expectedGoals`.

## UI

La card muestra equipos, horario/estado y una linea compacta de prediccion.

## Riesgos

- Sobrecargar la card.
- Mostrar predicciones de partidos finalizados.
- Recalcular demasiado en render.
