import type { ModelOutput, MatchStats, Fixture } from '@/lib/types'
import { poissonCdf, poissonPmf } from '@/lib/model/skills/poisson'
import {
  N_RECENT_MATCHES,
  STAGE_MULTIPLIER,
  WC_AVG_YELLOW_PER_MATCH,
  WC_AVG_RED_PER_MATCH,
  WC_AVG_CORNERS_PER_MATCH,
  CORNERS_FALLBACK_LINE,
  CARDS_LINE,
} from '@/lib/model/constants'
import { sanityCheck } from '@/lib/types'

function nonNullMean(values: Array<number | null>): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function lastN(stats: MatchStats[], teamId: number): MatchStats[] {
  return stats
    .filter(s => s.teamId === teamId)
    .slice(-N_RECENT_MATCHES)
}

function confidenceByCount(homeCount: number, awayCount: number): 'high' | 'medium' | 'low' {
  if (homeCount >= N_RECENT_MATCHES && awayCount >= N_RECENT_MATCHES) return 'high'
  if (homeCount >= 1 || awayCount >= 1) return 'medium'
  return 'low'
}

function roundToNearestHalf(x: number): number {
  return Math.round(x * 2) / 2
}

export function buildCardsOutputs(
  fixture: Fixture,
  matchStats: MatchStats[],
  homeTeamId: number,
  awayTeamId: number
): ModelOutput[] {
  const homeStats = lastN(matchStats, homeTeamId)
  const awayStats = lastN(matchStats, awayTeamId)

  const homeYellow = nonNullMean(homeStats.map(s => s.yellowCards))
  const awayYellow = nonNullMean(awayStats.map(s => s.yellowCards))
  const homeRed = nonNullMean(homeStats.map(s => s.redCards))
  const awayRed = nonNullMean(awayStats.map(s => s.redCards))

  const hasHistory = homeYellow !== null || awayYellow !== null

  let expectedCards: number
  let lambdaRed: number
  let confidence: 'high' | 'medium' | 'low'

  if (hasHistory) {
    const homeIdx = (homeYellow ?? 0) + 2 * (homeRed ?? 0)
    const awayIdx = (awayYellow ?? 0) + 2 * (awayRed ?? 0)
    const multiplier = STAGE_MULTIPLIER[fixture.round ?? ''] ?? 1.0
    expectedCards = (homeIdx + awayIdx) * multiplier
    lambdaRed = (homeRed ?? 0) + (awayRed ?? 0)
    confidence = confidenceByCount(homeStats.length, awayStats.length)
  } else {
    expectedCards = WC_AVG_YELLOW_PER_MATCH + 2 * WC_AVG_RED_PER_MATCH
    lambdaRed = WC_AVG_RED_PER_MATCH
    confidence = 'low'
  }

  const over35 = 1 - poissonCdf(Math.floor(CARDS_LINE), expectedCards)
  const under35 = 1 - over35

  const totalCardsOutput: ModelOutput = {
    market: 'total_cards',
    probabilities: { [`over_${CARDS_LINE}`]: over35, [`under_${CARDS_LINE}`]: under35 },
    confidence,
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(totalCardsOutput)

  const pRedYes = 1 - poissonPmf(0, lambdaRed)
  const redCardOutput: ModelOutput = {
    market: 'total_cards',
    probabilities: { red_yes: pRedYes, red_no: 1 - pRedYes },
    confidence,
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(redCardOutput)

  return [totalCardsOutput, redCardOutput]
}

export function buildCornersOutput(
  fixture: Fixture,
  matchStats: MatchStats[],
  homeTeamId: number,
  awayTeamId: number
): ModelOutput {
  const homeStats = lastN(matchStats, homeTeamId)
  const awayStats = lastN(matchStats, awayTeamId)

  const homeCorners = nonNullMean(homeStats.map(s => s.corners))
  const awayCorners = nonNullMean(awayStats.map(s => s.corners))

  const hasHistory = homeCorners !== null || awayCorners !== null

  let cornersLine: number
  let lambda: number
  let confidence: 'high' | 'medium' | 'low'

  if (hasHistory) {
    const expected = (homeCorners ?? WC_AVG_CORNERS_PER_MATCH / 2) +
      (awayCorners ?? WC_AVG_CORNERS_PER_MATCH / 2)
    cornersLine = roundToNearestHalf(expected)
    lambda = expected
    confidence = confidenceByCount(homeStats.length, awayStats.length)
  } else {
    cornersLine = CORNERS_FALLBACK_LINE
    lambda = WC_AVG_CORNERS_PER_MATCH
    confidence = 'low'
  }

  const over = 1 - poissonCdf(Math.floor(cornersLine), lambda)
  const under = 1 - over

  const output: ModelOutput = {
    market: 'corners',
    probabilities: { [`over_${cornersLine}`]: over, [`under_${cornersLine}`]: under },
    confidence,
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(output)
  return output
}
