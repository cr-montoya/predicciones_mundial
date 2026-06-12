import type { ModelOutput, Player } from '@/lib/types'
import { poissonPmf } from '@/lib/model/skills/poisson'
import { MIN_MINUTES_ELIGIBLE } from '@/lib/model/constants'
import { sanityCheck } from '@/lib/types'
import { sanityCheckProbabilityBounds } from '@/lib/model/sanity'

interface ScorerOutputs {
  anytimeScorer: ModelOutput
  firstScorer: ModelOutput
}

function eligiblePlayers(players: Player[]): Player[] {
  return players.filter(
    p => p.minutesPlayed >= MIN_MINUTES_ELIGIBLE && p.goalsPerMinute !== null && p.goalsPerMinute > 0
  )
}

function emptyOutput(market: ModelOutput['market']): ModelOutput {
  return {
    market,
    probabilities: {},
    confidence: 'low',
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
}

export function buildScorerOutputs(
  homePlayers: Player[],
  awayPlayers: Player[],
  lambdaHome: number,
  lambdaAway: number
): ScorerOutputs {
  const homeEligible = eligiblePlayers(homePlayers)
  const awayEligible = eligiblePlayers(awayPlayers)

  const noEligible = homeEligible.length === 0 && awayEligible.length === 0

  const anytimeScorer: ModelOutput = noEligible
    ? emptyOutput('anytime_scorer')
    : buildAnytime(homeEligible, awayEligible, lambdaHome, lambdaAway)

  const firstScorer: ModelOutput = noEligible
    ? emptyOutput('first_scorer')
    : buildFirst(homeEligible, awayEligible, lambdaHome, lambdaAway)

  return { anytimeScorer, firstScorer }
}

function buildAnytime(
  homeEligible: Player[],
  awayEligible: Player[],
  lambdaHome: number,
  lambdaAway: number
): ModelOutput {
  const probs: Record<string, number> = {}

  for (const group of [{ players: homeEligible, lambda: lambdaHome }, { players: awayEligible, lambda: lambdaAway }]) {
    const denom = group.players.reduce((a, p) => a + (p.goalsPerMinute ?? 0), 0)
    for (const p of group.players) {
      const weight = (p.goalsPerMinute ?? 0) / denom
      const expectedGoals = weight * group.lambda
      probs[`${p.id}_${p.name}`] = 1 - poissonPmf(0, expectedGoals)
    }
  }

  const output: ModelOutput = {
    market: 'anytime_scorer',
    probabilities: probs,
    confidence: 'low',
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
  sanityCheckProbabilityBounds(output)
  return output
}

function buildFirst(
  homeEligible: Player[],
  awayEligible: Player[],
  lambdaHome: number,
  lambdaAway: number
): ModelOutput {
  const probs: Record<string, number> = {}
  const lambdaMatch = lambdaHome + lambdaAway
  const pNoScorer = Math.exp(-lambdaMatch)

  function addGroup(players: Player[], teamLambda: number): void {
    if (players.length === 0) return
    const denom = players.reduce((a, p) => a + (p.goalsPerMinute ?? 0), 0)
    for (const p of players) {
      const weight = (p.goalsPerMinute ?? 0) / denom
      const expectedGoals = weight * teamLambda
      probs[`${p.id}_${p.name}`] = (1 - pNoScorer) * (expectedGoals / lambdaMatch)
    }
  }

  if (homeEligible.length > 0) addGroup(homeEligible, lambdaHome)
  if (awayEligible.length > 0) addGroup(awayEligible, lambdaAway)

  const massAssigned = Object.values(probs).reduce((a, b) => a + b, 0)
  probs['no_scorer'] = 1 - massAssigned

  const output: ModelOutput = {
    market: 'first_scorer',
    probabilities: probs,
    confidence: 'low',
    modelVersion: '1.0',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(output)
  return output
}
