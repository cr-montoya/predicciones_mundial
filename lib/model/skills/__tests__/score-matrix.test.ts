import { describe, it, expect } from 'vitest'
import { buildScoreMatrix } from '@/lib/model/skills/score-matrix'

function matrixSum(matrix: number[][]): number {
  let total = 0
  for (const row of matrix) {
    for (const cell of row) {
      total += cell
    }
  }
  return total
}

describe('buildScoreMatrix', () => {
  it('invariante de renormalizacion: suma de buildScoreMatrix(1.35, 1.35) es 1.0 (+-0.001)', () => {
    const matrix = buildScoreMatrix(1.35, 1.35)
    const total = matrixSum(matrix)
    expect(total).toBeCloseTo(1.0, 3)
  })

  it('para (3.0, 0.5): P[3][0] > P[0][3] (local muy ofensivo)', () => {
    const matrix = buildScoreMatrix(3.0, 0.5)
    expect(matrix[3][0]).toBeGreaterThan(matrix[0][3])
  })

  it('con lambdas en [0.2, 4.5]: suma siempre en [0.999, 1.001]', () => {
    const lambdaPairs: Array<[number, number]> = [
      [0.2, 0.2],
      [0.2, 4.5],
      [4.5, 0.2],
      [4.5, 4.5],
      [1.35, 1.35],
      [2.0, 1.0],
      [0.5, 3.0],
      [3.5, 3.5],
    ]
    for (const [lh, la] of lambdaPairs) {
      const matrix = buildScoreMatrix(lh, la)
      const total = matrixSum(matrix)
      expect(total).toBeGreaterThanOrEqual(0.999)
      expect(total).toBeLessThanOrEqual(1.001)
    }
  })

  it('la matriz es cuadrada y todas las celdas son no negativas', () => {
    const matrix = buildScoreMatrix(1.35, 1.35)
    const n = matrix.length
    expect(n).toBeGreaterThan(0)
    for (const row of matrix) {
      expect(row.length).toBe(n)
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('para equipos simetricos (1.35, 1.35): P[i][j] == P[j][i] (+-1e-10)', () => {
    const matrix = buildScoreMatrix(1.35, 1.35)
    const n = matrix.length
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        expect(matrix[i][j]).toBeCloseTo(matrix[j][i], 10)
      }
    }
  })
})
