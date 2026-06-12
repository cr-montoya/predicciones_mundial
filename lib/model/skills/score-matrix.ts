import { poissonPmf } from '@/lib/model/skills/poisson'
import { MAX_GOALS } from '@/lib/model/constants'

export function buildScoreMatrix(lambdaHome: number, lambdaAway: number): number[][] {
  const size = MAX_GOALS + 1
  const matrix: number[][] = Array.from({ length: size }, () => new Array<number>(size).fill(0))

  let total = 0
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cell = poissonPmf(i, lambdaHome) * poissonPmf(j, lambdaAway)
      matrix[i][j] = cell
      total += cell
    }
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      matrix[i][j] /= total
    }
  }

  return matrix
}
