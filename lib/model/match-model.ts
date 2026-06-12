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

export function computeMatchOutputs(input: MatchInput): ModelOutput[] {
  const { fixture, home, away, matchStats, homePlayers, awayPlayers } = input
  const { lambdaHome, lambdaAway } = computeLambdas(home, away)
  const matrix = buildScoreMatrix(lambdaHome, lambdaAway)

  const result1x2 = makeOutput('result_1x2', deriveResult1x2(matrix), 'medium')
  sanityCheck(result1x2)

  const doubleChance = makeOutput('double_chance', deriveDoubleChance(matrix), 'medium')
  sanityCheckProbabilityBounds(doubleChance)

  const ou15 = makeOutput('over_under_goals', deriveOverUnder(matrix, 1.5), 'medium')
  sanityCheck(ou15)

  const ou25 = makeOutput('over_under_goals', deriveOverUnder(matrix, 2.5), 'medium')
  sanityCheck(ou25)

  const ou35 = makeOutput('over_under_goals', deriveOverUnder(matrix, 3.5), 'medium')
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

  return [
    result1x2,
    doubleChance,
    ou15,
    ou25,
    ou35,
    btts,
    exactScore,
    cleanSheet,
    ...cardsOutputs,
    cornersOutput,
    anytimeScorer,
    firstScorer,
  ]
}
