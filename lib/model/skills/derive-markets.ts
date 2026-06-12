export function deriveResult1x2(matrix: number[][]): Record<string, number> {
  let home = 0, draw = 0, away = 0
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i > j) home += matrix[i][j]
      else if (i === j) draw += matrix[i][j]
      else away += matrix[i][j]
    }
  }
  return { home, draw, away }
}

export function deriveDoubleChance(matrix: number[][]): Record<string, number> {
  const { home, draw, away } = deriveResult1x2(matrix)
  return { '1X': home + draw, '12': home + away, 'X2': draw + away }
}

export function deriveOverUnder(matrix: number[][], line: number): Record<string, number> {
  let over = 0
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i + j > line) over += matrix[i][j]
    }
  }
  const under = 1 - over
  return { over, under }
}

export function deriveBtts(matrix: number[][]): Record<string, number> {
  let yes = 0
  for (let i = 1; i < matrix.length; i++) {
    for (let j = 1; j < matrix[i].length; j++) {
      yes += matrix[i][j]
    }
  }
  return { yes, no: 1 - yes }
}

export function deriveExactScore(matrix: number[][], topN: number): Record<string, number> {
  const cells: Array<{ key: string; prob: number }> = []
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      cells.push({ key: `${i}-${j}`, prob: matrix[i][j] })
    }
  }
  cells.sort((a, b) => b.prob - a.prob)
  const top = cells.slice(0, topN)
  const topSum = top.reduce((acc, c) => acc + c.prob, 0)
  const result: Record<string, number> = {}
  for (const c of top) result[c.key] = c.prob
  result['other'] = 1 - topSum
  return result
}

export function deriveCleanSheet(matrix: number[][]): { home: number; away: number } {
  let home = 0, away = 0
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (j === 0) home += matrix[i][j]
      if (i === 0) away += matrix[i][j]
    }
  }
  return { home, away }
}
