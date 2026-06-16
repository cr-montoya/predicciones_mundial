export interface MarketCopy {
  label: string
  shortLabel: string
  description: string
  example: string
  confidenceNote?: string
}

export const MARKET_COPY: Record<string, MarketCopy> = {
  result_1x2: {
    label: 'Resultado del partido',
    shortLabel: '1X2',
    description: 'Probabilidad de que gane el local, haya empate o gane el visitante al final del tiempo reglamentario.',
    example: 'Local 60% significa que el modelo proyecta 6 de cada 10 simulaciones con victoria local.',
  },
  double_chance: {
    label: 'Doble oportunidad',
    shortLabel: 'Doble oportunidad',
    description: 'Cubre dos de los tres resultados posibles en una sola lectura.',
    example: '1X cubre victoria local o empate; su probabilidad es la suma de ambos resultados, que son mutuamente excluyentes.',
  },
  over_under_goals_1_5: {
    label: 'Más/Menos 1.5 goles',
    shortLabel: 'O/U 1.5',
    description: 'Probabilidad de que el total de goles supere o no la línea de 1.5.',
    example: 'Más de 1.5 al 75% significa que en 75 de 100 simulaciones cayeron 2 o más goles.',
  },
  over_under_goals_2_5: {
    label: 'Más/Menos 2.5 goles',
    shortLabel: 'O/U 2.5',
    description: 'Probabilidad de que el total de goles supere o no la línea de 2.5.',
    example: 'Más de 2.5 al 62% significa que en 62 de 100 simulaciones cayeron 3 o más goles.',
  },
  over_under_goals_3_5: {
    label: 'Más/Menos 3.5 goles',
    shortLabel: 'O/U 3.5',
    description: 'Probabilidad de que el total de goles supere o no la línea de 3.5.',
    example: 'Menos de 3.5 al 70% significa que en 70 de 100 simulaciones el partido terminó con 3 goles o menos.',
  },
  btts: {
    label: 'Ambos marcan',
    shortLabel: 'Ambos marcan',
    description: 'Probabilidad de que los dos equipos anoten al menos un gol en el partido.',
    example: 'Sí al 55% indica que en más de la mitad de las simulaciones ambos equipos marcaron.',
  },
  exact_score: {
    label: 'Marcador exacto',
    shortLabel: 'Marcador exacto',
    description: 'Marcadores más probables según la matriz Poisson generada con los goles esperados de cada equipo.',
    example: 'El marcador más probable raramente supera el 20%: los resultados exactos son inherentemente impredecibles.',
    confidenceNote: 'Usar como referencia de tendencia, no de certeza.',
  },
  first_scorer: {
    label: 'Primer goleador',
    shortLabel: '1er goleador',
    description: 'Probabilidad de que un jugador marque el primer gol, basada en goles por 90 min históricos y el lambda del equipo.',
    example: 'Un jugador con 30% proyecta que en 3 de 10 simulaciones marcó primero. "Desconocido" agrupa jugadores sin datos.',
    confidenceNote: 'Confianza baja sin alineación confirmada o minutos esperados precisos.',
  },
  anytime_scorer: {
    label: 'Goleador en cualquier momento',
    shortLabel: 'Goleador',
    description: 'Probabilidad de que un jugador marque en algún momento del partido. Siempre mayor o igual que ser el primer goleador.',
    example: 'Un jugador con 45% de goleador tiene mayor probabilidad que de marcar primero, pues cuenta todo el partido.',
    confidenceNote: 'Confianza baja sin alineación confirmada o minutos esperados precisos.',
  },
  total_cards: {
    label: 'Tarjetas',
    shortLabel: 'Tarjetas',
    description: 'Estimación de la probabilidad de tarjeta roja o de que el total de amarillas supere una línea.',
    example: 'Sin roja al 85% significa que en 85 de 100 simulaciones no hubo tarjeta roja.',
    confidenceNote: 'Las tarjetas dependen del árbitro, contexto e intensidad. Confianza normalmente baja.',
  },
  corners: {
    label: 'Tiros de esquina',
    shortLabel: 'Esquinas',
    description: 'Estimación del total de tiros de esquina en el partido. Depende del estilo ofensivo de ambos equipos.',
    example: 'Más de 9.5 esquinas al 48% indica un partido equilibrado en este mercado.',
    confidenceNote: 'Los tiros de esquina son más volátiles que los goles. Confianza media-baja.',
  },
  clean_sheet: {
    label: 'Gana a cero',
    shortLabel: 'Portería a cero',
    description: 'Probabilidad de que un equipo gane el partido sin recibir goles.',
    example: 'Local gana a cero al 25% significa que en 1 de 4 simulaciones el local ganó sin conceder.',
  },
  tournament_winner: {
    label: 'Campeón del torneo',
    shortLabel: 'Campeón',
    description: 'Proyección de campeón basada en simulación Monte Carlo del torneo completo (10.000 iteraciones).',
    example: 'España 15% significa que en 15 de cada 100 simulaciones España ganó el torneo.',
  },
  golden_boot: {
    label: 'Bota de Oro',
    shortLabel: 'Bota de Oro',
    description: 'Proyección del máximo goleador del torneo, basada en goles esperados por partido y partidos proyectados.',
    example: 'Un jugador con 12% proyecta que en 12 de 100 simulaciones fue el máximo goleador.',
    confidenceNote: 'Alta incertidumbre: depende de que el equipo llegue lejos y el jugador esté activo.',
  },
}

export function getMarketCopy(market: string): MarketCopy | undefined {
  return MARKET_COPY[market]
}

const OUTCOME_TRANSLATIONS: Record<string, string> = {
  home: 'Local',
  away: 'Visitante',
  draw: 'Empate',
  over: 'Más',
  under: 'Menos',
  yes: 'Ambos anotan',
  no: 'Al menos uno no marca',
  '1X': 'Local o empate',
  '12': 'Sin empate',
  X2: 'Visitante o empate',
  red_yes: 'Hay roja',
  red_no: 'Sin roja',
  unknown: 'Otro jugador',
}

export function translateOutcome(market: string, outcome: string): string {
  if (market.startsWith('over_under_goals_')) {
    const line = market.replace('over_under_goals_', '').replace('_', '.')
    if (outcome === 'over') return `Más de ${line}`
    if (outcome === 'under') return `Menos de ${line}`
  }
  // Outcomes dinámicos de tarjetas y esquinas: over_3.5, under_10.5, etc.
  const dynOver = outcome.match(/^over_(\d+(?:\.\d+)?)$/)
  if (dynOver) return `Más de ${dynOver[1]}`
  const dynUnder = outcome.match(/^under_(\d+(?:\.\d+)?)$/)
  if (dynUnder) return `Menos de ${dynUnder[1]}`

  return OUTCOME_TRANSLATIONS[outcome] ?? outcome
}

export const MARKET_SHORT_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(MARKET_COPY).map(([k, v]) => [k, v.shortLabel])
)
