import type { Team } from '@/lib/types'
import {
  AVG_GOALS_PER_TEAM,
  LAMBDA_MIN,
  LAMBDA_MAX,
  FORM_MIN,
  FORM_MAX,
} from '@/lib/model/constants'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

interface LambdaPair {
  lambdaHome: number
  lambdaAway: number
}

export function computeLambdas(home: Team, away: Team): LambdaPair {
  const formHome = clamp(home.recentForm ?? 1.0, FORM_MIN, FORM_MAX)
  const formAway = clamp(away.recentForm ?? 1.0, FORM_MIN, FORM_MAX)

  const rawHome =
    AVG_GOALS_PER_TEAM *
    home.attackStrength *
    away.defenseStrength *
    home.homeAdvantage *
    formHome

  const rawAway =
    AVG_GOALS_PER_TEAM *
    away.attackStrength *
    home.defenseStrength *
    1.0 *
    formAway

  return {
    lambdaHome: clamp(rawHome, LAMBDA_MIN, LAMBDA_MAX),
    lambdaAway: clamp(rawAway, LAMBDA_MIN, LAMBDA_MAX),
  }
}
