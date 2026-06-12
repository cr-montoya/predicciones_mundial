# PLAN.md — Mundial 2026 IA Predictor

Plan de implementación por fases. Objetivo: app en Next.js que corre en local, recalcula bajo demanda y proyecta todos los mercados estadísticos por partido, lista para grabar contenido.

---

## Arquitectura general

```
Refresh manual (script o botón "Actualizar")
   -> Ingesta de data (API-Football)
   -> Normaliza y guarda en SQLite (archivo local)
   -> Corre el modelo de predicción
   -> Guarda predicciones con timestamp
   -> Dashboard (Next.js) lee de SQLite y renderiza
```

Todo corre en local con `pnpm dev`. No hay proceso 24/7 ni deploy: tú disparas el refresh cuando quieres, controlando el consumo de la API.

Tres capas separadas: ingesta (data cruda), modelo (math puro, sin red), presentación (UI). El modelo nunca llama a la API; solo consume lo que ya está en DB. Esto lo hace testeable y rápido.

---

## Fuentes de datos

1. **API-Football (RapidAPI)** — recomendada. Tiene fixtures, resultados en vivo, lineups, eventos (goles, tarjetas, minuto), estadísticas por partido (corners, shots, posesión) y stats por jugador. Plan free: 100 requests/día.
2. **football-data.org** — free, buena para fixtures y resultados, sirve de fallback.

---

## Mercados que proyecta el modelo

- **Resultado 1X2**: gana local / empate / gana visitante.
- **Doble oportunidad**: 1X, 12, X2.
- **Over/Under goles**: líneas 1.5, 2.5, 3.5.
- **BTTS** (ambos marcan): sí / no.
- **Marcador exacto**: top 5 marcadores más probables.
- **Goleador**: primer goleador y goleador en cualquier momento.
- **Total de tarjetas**: over/under 3.5, probabilidad de roja.
- **Corners**: over/under (línea dinámica).
- **Clean sheet / gana a cero**.
- **Torneo**: clasificados por grupo, proyección de campeón, Bota de Oro.

---

## El modelo (lib/model/)

- **Base**: distribución de Poisson sobre goles esperados (xG). Estándar de la industria para proyectar goles, BTTS, over/under y marcador exacto.
- **Lambda (goles esperados)**: fuerza ofensiva del equipo, fuerza defensiva del rival, ranking FIFA, forma reciente (últimos 5-10 partidos), ventaja de sede.
- **Tarjetas y corners**: regresión sobre promedios históricos ajustada por intensidad del partido.
- **Goleadores**: reparte el lambda del equipo entre jugadores según goles por minuto histórico.
- **Campeón / Bota de Oro**: Monte Carlo — correr el torneo 10.000 veces y contar frecuencias.

---

## Fases

### Fase 0 — Setup
- create-next-app con TS, Tailwind, App Router.
- shadcn/ui init, Recharts, better-sqlite3, vitest.
- Estructura: app/, lib/data/, lib/model/, lib/db/, scripts/refresh.ts.
- DB en data/mundial.db (gitignored).
- .env.example con RAPIDAPI_KEY.

### Fase 1 — Ingesta y DB
- Schema SQLite: teams, players, fixtures, match_events, match_stats, predictions.
- Cliente de API-Football con retry y cache.
- Seed de los 12 grupos y 48 equipos del Mundial 2026.

### Fase 2 — Modelo de predicción
- lib/model/poisson.ts: goles esperados -> matriz de probabilidad de marcadores.
- Derivar de esa matriz: 1X2, over/under, BTTS, marcador exacto.
- lib/model/cards.ts, corners.ts, scorers.ts, montecarlo.ts.
- Tests con vitest para validar que los números tienen sentido.

### Fase 3 — Refresh bajo demanda
- scripts/refresh.ts: trae resultados nuevos, actualiza forma, recalcula predicciones. Se corre con `pnpm refresh`.
- Server Action de refresh para el botón "Actualizar" del dashboard, reutilizando la misma lógica que el script.
- Guarda de frescura: el refresh no vuelve a llamar a la API si la última corrida fue hace menos de N minutos (protege la cuota free de 100 req/día).
- Sin node-cron ni scheduler: el control de cuándo refrescar es manual.

### Fase 4 — Dashboard
- Home: proyección de campeón (Monte Carlo) + Bota de Oro.
- Vista grupo: tabla proyectada de clasificación.
- Vista partido: todos los mercados en cards visuales.
- Diseño oscuro, tipografía grande, colores por probabilidad.

### Fase 5 — Pulido
- Animaciones con framer-motion.
- Banner: "Análisis estadístico de entretenimiento. No es asesoría de apuestas."
- Modo captura: vista limpia para los clips.
- Indicador de "última actualización" (timestamp de la última corrida) visible en la UI.

### Fase 6 — Diseño Broadcast
- **Estilo visual**: Look de terminal de datos deportiva (broadcast / Opta). Números grandes como protagonista. Fondo oscuro con acento. Visualizaciones custom (no Recharts default).
- **Home rediseñado**:
  - Partidos del día (fixtures con estado y horario)
  - Top 10 mercados recomendados (highest-probability markets across all matches)
  - Candidatos a campeón y Bota de Oro (secundarios, pero presentes)
- **Paleta**: Oscuro + un acento (dorado, cian, verde). Sin gradientes morados genéricos. Sin cards redondeadas flotando.
- **Tipografía**: Monoespaciada (ya en Tailwind), números en 3xl/4xl, etiquetas en caps tracking-widest.

### Fase 7 — Branding FIFA World Cup 2026
- **Logo y colores oficiales**: Rojo (#c8102e) + Verde México (#009a44) + Azul Canadá (#002868) + Fondo navy (#060d1a).
- **Header mejorado**: Trofeo SVG en rojo, franja horizontal de 3 colores (rojo-verde-azul).
- **Hero badge**: "FIFA WORLD CUP" con fondo rojo, texto oscuro.
- **Layout hero refinado**: Número de partidos más proporcional, alineado horizontalmente con texto descriptivo.
- **Candidatos expandibles**: Botón "VER MÁS →" para expandir lista completa (top 5 por defecto).

### Fase 8 — Datos históricos para calibración de equipos
- **Problema**: Todos los equipos están en `attack_strength = defense_strength = 1.0`, causando probabilidades uniformes (~2% todos).
- **Solución**: Precomputar stats históricos (últimos 4 años de competiciones: Mundiales 2022/2018, Copas América, Euros, Clasificatorias).
- **Implementación**:
  - Crear `lib/data/historical-stats.json` con `attack_strength` y `defense_strength` por equipo.
  - En `run-refresh.ts`, cargar stats del JSON y pasarlos a `recomputeStrengths()`.
  - Resultado: France, Spain, Argentina, etc. suben a 5-10% en tournament_winner; Haiti baja a <1%.
- **Verificación**: `pnpm refresh` y validar DB que France > 1.0 attack_strength.

---

## Riesgos

- **Límite API free**: como el refresh es manual y tiene guarda de frescura, tú controlas cada llamada y respetas los 100 req/día. Para data en vivo durante partidos hay que pasar a plan pago.
- **Calidad de predicciones**: Poisson es sólido para goles, más ruidoso para tarjetas/corners. Mostrar confianza baja en esos mercados.
- **Legal**: mientras la app solo muestre probabilidades y no reciba dinero, es análisis estadístico.