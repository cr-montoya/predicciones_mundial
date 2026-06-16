import type { Team, Fixture, MatchStats, Player, ModelOutput } from '@/lib/types'
import { sanityCheck } from '@/lib/types'
import { sanityCheckProbabilityBounds } from '@/lib/model/sanity'
import { computeLambdas } from '@/lib/model/lambda'
import { buildScoreMatrix } from '@/lib/model/skills/score-matrix'
import {
  deriveResult1x2,
  deriveDoubleChance,
  deriveOverUnder,
  deriveBtts,
  deriveExactScore,
  deriveCleanSheet,
  deriveTeamTotal,
  deriveWinToNil,
} from '@/lib/model/skills/derive-markets'
import { buildCardsOutputs, buildCornersOutput } from '@/lib/model/cards-corners'
import { buildScorerOutputs } from '@/lib/model/scorers'

export interface MatchInput {
  fixture: Fixture
  home: Team
  away: Team
  matchStats: MatchStats[]
  homePlayers: Player[]
  awayPlayers: Player[]
}

function makeOutput(
  market: ModelOutput['market'],
  probabilities: Record<string, number>,
  confidence: ModelOutput['confidence']
): ModelOutput {
  return { market, probabilities, confidence, modelVersion: '1.0', computedAt: new Date().toISOString() }
}

function teamTotalConfidence(
  matrix: number[][],
  side: 'home' | 'away',
  line: number
): ModelOutput['confidence'] {
  const probs = deriveTeamTotal(matrix, side, line)
  const pMax = Math.max(probs.over, probs.under)
  if (pMax >= 0.70) return 'high'
  if (pMax >= 0.58) return 'medium'
  return 'low'
}

function winToNilConfidence(probs: { home: number; away: number }): ModelOutput['confidence'] {
  const pMax = Math.max(probs.home, probs.away)
  if (pMax >= 0.45) return 'high'
  if (pMax >= 0.30) return 'medium'
  return 'low'
}

export function computeMatchOutputs(input: MatchInput): ModelOutput[] {
  const { fixture, home, away, matchStats, homePlayers, awayPlayers } = input
  const { lambdaHome, lambdaAway } = computeLambdas(home, away)
  const matrix = buildScoreMatrix(lambdaHome, lambdaAway)

  const result1x2 = makeOutput('result_1x2', deriveResult1x2(matrix), 'medium')
  sanityCheck(result1x2)

  const doubleChance = makeOutput('double_chance', deriveDoubleChance(matrix), 'medium')
  sanityCheckProbabilityBounds(doubleChance)

  const ou15 = makeOutput('over_under_goals_1_5', deriveOverUnder(matrix, 1.5), 'medium')
  sanityCheck(ou15)

  const ou25 = makeOutput('over_under_goals_2_5', deriveOverUnder(matrix, 2.5), 'medium')
  sanityCheck(ou25)

  const ou35 = makeOutput('over_under_goals_3_5', deriveOverUnder(matrix, 3.5), 'medium')
  sanityCheck(ou35)

  const btts = makeOutput('btts', deriveBtts(matrix), 'medium')
  sanityCheck(btts)

  const exactScoreProbs = deriveExactScore(matrix, 5)
  const exactScore = makeOutput('exact_score', exactScoreProbs, 'medium')
  sanityCheck(exactScore)

  const csResult = deriveCleanSheet(matrix)
  const cleanSheet = makeOutput('clean_sheet', { home: csResult.home, away: csResult.away }, 'medium')
  sanityCheckProbabilityBounds(cleanSheet)

  const cardsOutputs = buildCardsOutputs(fixture, matchStats, home.id, away.id)
  const cornersOutput = buildCornersOutput(fixture, matchStats, home.id, away.id)

  const { anytimeScorer, firstScorer } = buildScorerOutputs(
    homePlayers,
    awayPlayers,
    lambdaHome,
    lambdaAway
  )

  const homeGoals05 = makeOutput('home_team_goals_0_5', deriveTeamTotal(matrix, 'home', 0.5), teamTotalConfidence(matrix, 'home', 0.5))
  sanityCheck(homeGoals05)

  const homeGoals15 = makeOutput('home_team_goals_1_5', deriveTeamTotal(matrix, 'home', 1.5), teamTotalConfidence(matrix, 'home', 1.5))
  sanityCheck(homeGoals15)

  const homeGoals25 = makeOutput('home_team_goals_2_5', deriveTeamTotal(matrix, 'home', 2.5), teamTotalConfidence(matrix, 'home', 2.5))
  sanityCheck(homeGoals25)

  const awayGoals05 = makeOutput('away_team_goals_0_5', deriveTeamTotal(matrix, 'away', 0.5), teamTotalConfidence(matrix, 'away', 0.5))
  sanityCheck(awayGoals05)

  const awayGoals15 = makeOutput('away_team_goals_1_5', deriveTeamTotal(matrix, 'away', 1.5), teamTotalConfidence(matrix, 'away', 1.5))
  sanityCheck(awayGoals15)

  const awayGoals25 = makeOutput('away_team_goals_2_5', deriveTeamTotal(matrix, 'away', 2.5), teamTotalConfidence(matrix, 'away', 2.5))
  sanityCheck(awayGoals25)

  const winToNilProbs = deriveWinToNil(matrix)
  const winToNil = makeOutput('win_to_nil', winToNilProbs, winToNilConfidence(winToNilProbs))
  sanityCheckProbabilityBounds(winToNil)

  return [
    result1x2,
    doubleChance,
    ou15,
    ou25,
    ou35,
    btts,
    exactScore,
    cleanSheet,
    homeGoals05,
    homeGoals15,
    homeGoals25,
    awayGoals05,
    awayGoals15,
    awayGoals25,
    winToNil,
    ...cardsOutputs,
    cornersOutput,
    anytimeScorer,
    firstScorer,
  ]
}
