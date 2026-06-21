import type { ModelOutput, PlayerScorerInput } from '@/lib/types'
import { poissonPmf } from '@/lib/model/skills/poisson'
import { sanityCheck } from '@/lib/types'
import { sanityCheckProbabilityBounds } from '@/lib/model/sanity'

interface ScorerOutputs {
  anytimeScorer: ModelOutput
  firstScorer: ModelOutput
}

function eligibleInputs(inputs: PlayerScorerInput[]): PlayerScorerInput[] {
  return inputs.filter(p => p.goalsPerMinute > 0)
}

function emptyOutput(market: ModelOutput['market']): ModelOutput {
  return {
    market,
    probabilities: {},
    confidence: 'low',
    modelVersion: '1.1',
    computedAt: new Date().toISOString(),
  }
}

function effectiveRate(input: PlayerScorerInput): number {
  const sp = Math.max(0, Math.min(1, input.starterProbability))
  return input.goalsPerMinute * sp
}

function buildWeights(inputs: PlayerScorerInput[]): Map<PlayerScorerInput, number> {
  const rates = inputs.map(i => effectiveRate(i))
  let denom = rates.reduce((a, r) => a + r, 0)

  const useFallback = denom <= 0
  if (useFallback) {
    denom = inputs.reduce((a, p) => a + p.goalsPerMinute, 0)
  }

  const weights = new Map<PlayerScorerInput, number>()
  for (let idx = 0; idx < inputs.length; idx++) {
    const numerator = useFallback ? inputs[idx].goalsPerMinute : rates[idx]
    weights.set(inputs[idx], denom > 0 ? numerator / denom : 0)
  }
  return weights
}

export function buildScorerOutputs(
  homeInputs: PlayerScorerInput[],
  awayInputs: PlayerScorerInput[],
  lambdaHome: number,
  lambdaAway: number,
  confidence: ModelOutput['confidence'] = 'low'
): ScorerOutputs {
  const homeEligible = eligibleInputs(homeInputs)
  const awayEligible = eligibleInputs(awayInputs)

  const noEligible = homeEligible.length === 0 && awayEligible.length === 0

  const anytimeScorer: ModelOutput = noEligible
    ? emptyOutput('anytime_scorer')
    : buildAnytime(homeEligible, awayEligible, lambdaHome, lambdaAway, confidence)

  const firstScorer: ModelOutput = noEligible
    ? emptyOutput('first_scorer')
    : buildFirst(homeEligible, awayEligible, lambdaHome, lambdaAway, confidence)

  return { anytimeScorer, firstScorer }
}

function buildAnytime(
  homeEligible: PlayerScorerInput[],
  awayEligible: PlayerScorerInput[],
  lambdaHome: number,
  lambdaAway: number,
  confidence: ModelOutput['confidence']
): ModelOutput {
  const probs: Record<string, number> = {}

  for (const group of [
    { inputs: homeEligible, lambda: lambdaHome },
    { inputs: awayEligible, lambda: lambdaAway },
  ]) {
    const weights = buildWeights(group.inputs)
    for (const input of group.inputs) {
      const er = effectiveRate(input)
      if (er === 0) continue
      const weight = weights.get(input) ?? 0
      const expectedGoals = weight * group.lambda
      probs[`${input.playerId}_${input.playerName}`] = 1 - poissonPmf(0, expectedGoals)
    }
  }

  const output: ModelOutput = {
    market: 'anytime_scorer',
    probabilities: probs,
    confidence,
    modelVersion: '1.1',
    computedAt: new Date().toISOString(),
  }
  sanityCheckProbabilityBounds(output)
  return output
}

function buildFirst(
  homeEligible: PlayerScorerInput[],
  awayEligible: PlayerScorerInput[],
  lambdaHome: number,
  lambdaAway: number,
  confidence: ModelOutput['confidence']
): ModelOutput {
  const probs: Record<string, number> = {}
  const lambdaMatch = lambdaHome + lambdaAway
  const pNoScorer = Math.exp(-lambdaMatch)

  function addGroup(inputs: PlayerScorerInput[], teamLambda: number): void {
    if (inputs.length === 0) return
    const weights = buildWeights(inputs)
    for (const input of inputs) {
      const er = effectiveRate(input)
      if (er === 0) continue
      const weight = weights.get(input) ?? 0
      const expectedGoals = weight * teamLambda
      probs[`${input.playerId}_${input.playerName}`] = (1 - pNoScorer) * (expectedGoals / lambdaMatch)
    }
  }

  if (homeEligible.length > 0) addGroup(homeEligible, lambdaHome)
  if (awayEligible.length > 0) addGroup(awayEligible, lambdaAway)

  const massAssigned = Object.values(probs).reduce((a, b) => a + b, 0)
  probs['no_scorer'] = 1 - massAssigned

  const output: ModelOutput = {
    market: 'first_scorer',
    probabilities: probs,
    confidence,
    modelVersion: '1.1',
    computedAt: new Date().toISOString(),
  }
  sanityCheck(output)
  return output
}
