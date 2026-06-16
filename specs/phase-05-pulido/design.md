# Design: Fase 5 - Pulido

## Elementos

- `DisclaimerBanner`.
- `LastUpdated`.
- `CaptureWrapper`.
- Animaciones con framer-motion en componentes client aislados.

## Decisiones

- Mantener animaciones como mejora, no requisito de lectura.
- Disclaimer con tono claro: entretenimiento, no asesoria.
- Modo captura reduce ruido visual.

## Riesgos

- Animaciones afectando SSR/hidratacion.
- Disclaimer demasiado invasivo.
