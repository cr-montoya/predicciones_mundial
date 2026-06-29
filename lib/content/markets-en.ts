import type { MarketCopy } from './markets-es'

export const MARKET_COPY_EN: Record<string, MarketCopy> = {
  result_1x2: {
    label: 'Match result',
    shortLabel: '1X2',
    description: 'Probability of a home win, draw, or away win at the end of regular time.',
    example: 'Home 60% means the model projects 6 out of 10 simulations with a home victory.',
  },
  double_chance: {
    label: 'Double chance',
    shortLabel: 'Double chance',
    description: 'Covers two of the three possible outcomes in a single read.',
    example: '1X covers home win or draw; its probability is the sum of both outcomes, which are mutually exclusive.',
  },
  over_under_goals_1_5: {
    label: 'Over/Under 1.5 goals',
    shortLabel: 'O/U 1.5',
    description: 'Probability that total goals exceed or fall below the 1.5 line.',
    example: 'Over 1.5 at 75% means that in 75 out of 100 simulations, 2 or more goals were scored.',
  },
  over_under_goals_2_5: {
    label: 'Over/Under 2.5 goals',
    shortLabel: 'O/U 2.5',
    description: 'Probability that total goals exceed or fall below the 2.5 line.',
    example: 'Over 2.5 at 62% means that in 62 out of 100 simulations, 3 or more goals were scored.',
  },
  over_under_goals_3_5: {
    label: 'Over/Under 3.5 goals',
    shortLabel: 'O/U 3.5',
    description: 'Probability that total goals exceed or fall below the 3.5 line.',
    example: 'Under 3.5 at 70% means that in 70 out of 100 simulations the match ended with 3 goals or fewer.',
  },
  btts: {
    label: 'Both teams to score',
    shortLabel: 'Both to score',
    description: 'Probability that both teams score at least one goal in the match.',
    example: 'Yes at 55% indicates that in more than half of the simulations both teams scored.',
  },
  exact_score: {
    label: 'Exact score',
    shortLabel: 'Exact score',
    description: 'Most likely scorelines according to the Poisson matrix generated with expected goals for each team.',
    example: 'The most likely scoreline rarely exceeds 20%: exact results are inherently unpredictable.',
    confidenceNote: 'Use as a trend reference, not as certainty.',
  },
  first_scorer: {
    label: 'First goalscorer',
    shortLabel: '1st scorer',
    description: 'Probability that a player scores the first goal, based on historical goals per 90 min and team lambda.',
    example: 'A player at 30% projects that in 3 out of 10 simulations they scored first. "Unknown" groups players without data.',
    confidenceNote: 'Low confidence without a confirmed lineup or precise expected minutes.',
  },
  anytime_scorer: {
    label: 'Anytime goalscorer',
    shortLabel: 'Goalscorer',
    description: 'Probability that a player scores at any point during the match. Always greater than or equal to being the first scorer.',
    example: 'A player with 45% goalscorer probability has a higher chance than scoring first, as the full match is counted.',
    confidenceNote: 'Low confidence without a confirmed lineup or precise expected minutes.',
  },
  total_cards: {
    label: 'Cards',
    shortLabel: 'Cards',
    description: 'Estimated probability of a red card or that total yellows exceed a line.',
    example: 'No red at 85% means that in 85 out of 100 simulations there was no red card.',
    confidenceNote: 'Cards depend on the referee, context, and intensity. Confidence is normally low.',
  },
  corners: {
    label: 'Corner kicks',
    shortLabel: 'Corners',
    description: 'Estimated total corner kicks in the match. Depends on the attacking style of both teams.',
    example: 'Over 9.5 corners at 48% indicates a balanced match in this market.',
    confidenceNote: 'Corner kicks are more volatile than goals. Medium-low confidence.',
  },
  clean_sheet: {
    label: 'Win to nil',
    shortLabel: 'Clean sheet',
    description: 'Probability that a team wins the match without conceding a goal.',
    example: 'Home win to nil at 25% means that in 1 out of 4 simulations the home team won without conceding.',
  },
  tournament_winner: {
    label: 'Tournament winner',
    shortLabel: 'Champion',
    description: 'Championship projection based on a full Monte Carlo tournament simulation (10,000 iterations).',
    example: 'Spain 15% means that in 15 out of 100 simulations Spain won the tournament.',
  },
  golden_boot: {
    label: 'Golden Boot',
    shortLabel: 'Golden Boot',
    description: 'Projection of the top scorer of the tournament, based on expected goals per match and projected matches.',
    example: 'A player at 12% projects that in 12 out of 100 simulations they were the top scorer.',
    confidenceNote: 'High uncertainty: depends on the team advancing far and the player remaining active.',
  },
  home_team_goals_0_5: {
    label: 'Home goals Over/Under 0.5',
    shortLabel: 'Home O/U 0.5',
    description: 'Probability that the home team scores more than 0.5 goals (i.e., at least 1). Derived from the home team xG.',
    example: 'Over 0.5 at 78% indicates the home team has a high probability of scoring at least one goal.',
    confidenceNote: 'Directly depends on the home team offensive strength.',
  },
  home_team_goals_1_5: {
    label: 'Home goals Over/Under 1.5',
    shortLabel: 'Home O/U 1.5',
    description: 'Probability that the home team scores more than 1.5 goals (at least 2). Derived from the home team xG.',
    example: 'Over 1.5 at 45% indicates a balanced scenario for the home team scoring 2 or more.',
    confidenceNote: 'Directly depends on the home team offensive strength.',
  },
  home_team_goals_2_5: {
    label: 'Home goals Over/Under 2.5',
    shortLabel: 'Home O/U 2.5',
    description: 'Probability that the home team scores more than 2.5 goals (at least 3). Derived from the home team xG.',
    example: 'Over 2.5 at 22% indicates the home team needs a very attacking performance to exceed this line.',
    confidenceNote: 'Directly depends on the home team offensive strength.',
  },
  away_team_goals_0_5: {
    label: 'Away goals Over/Under 0.5',
    shortLabel: 'Away O/U 0.5',
    description: 'Probability that the away team scores more than 0.5 goals (at least 1). Derived from the away team xG.',
    example: 'Over 0.5 at 65% indicates the away team has a high probability of scoring at least one goal.',
    confidenceNote: 'Directly depends on the away team offensive strength.',
  },
  away_team_goals_1_5: {
    label: 'Away goals Over/Under 1.5',
    shortLabel: 'Away O/U 1.5',
    description: 'Probability that the away team scores more than 1.5 goals (at least 2). Derived from the away team xG.',
    example: 'Over 1.5 at 35% indicates the away team has a moderate probability of scoring 2 or more goals.',
    confidenceNote: 'Directly depends on the away team offensive strength.',
  },
  away_team_goals_2_5: {
    label: 'Away goals Over/Under 2.5',
    shortLabel: 'Away O/U 2.5',
    description: 'Probability that the away team scores more than 2.5 goals (at least 3). Derived from the away team xG.',
    example: 'Over 2.5 at 15% indicates it is unlikely that the away team scores 3 or more in this match.',
    confidenceNote: 'Directly depends on the away team offensive strength.',
  },
  win_to_nil: {
    label: 'Win to nil',
    shortLabel: 'Win to nil',
    description: 'Probability that a team wins the match without conceding a goal. Home and away values are independent events and do not sum to 1.',
    example: 'Home win to nil at 28% and away win to nil at 18% do not add up to 100%: both exclude a draw and are distinct scenarios.',
  },
}

const OUTCOME_TRANSLATIONS_EN: Record<string, string> = {
  home: 'Home',
  away: 'Away',
  draw: 'Draw',
  over: 'Over',
  under: 'Under',
  yes: 'Both score',
  no: 'At least one does not score',
  '1X': 'Home or draw',
  '12': 'No draw',
  X2: 'Away or draw',
  red_yes: 'Red card',
  red_no: 'No red card',
  unknown: 'Other player',
}

export function translateOutcomeEn(market: string, outcome: string): string {
  if (market.startsWith('over_under_goals_')) {
    const line = market.replace('over_under_goals_', '').replace('_', '.')
    if (outcome === 'over') return `Over ${line}`
    if (outcome === 'under') return `Under ${line}`
  }
  const dynOver = outcome.match(/^over_(\d+(?:\.\d+)?)$/)
  if (dynOver) return `Over ${dynOver[1]}`
  const dynUnder = outcome.match(/^under_(\d+(?:\.\d+)?)$/)
  if (dynUnder) return `Under ${dynUnder[1]}`

  const playerKey = outcome.match(/^\d+_(.+)$/)
  if (playerKey) return playerKey[1]

  return OUTCOME_TRANSLATIONS_EN[outcome] ?? outcome
}
