export function calcEntropy(probs: Record<string, number>): number {
  const values = Object.values(probs).filter(p => p > 0)
  if (values.length === 0) return 0
  const maxEntropy = Math.log2(values.length)
  if (maxEntropy === 0) return 0
  const rawEntropy = values.reduce((acc, p) => acc - p * Math.log2(p), 0)
  return rawEntropy / maxEntropy
}

export function calcConfidenceScore(probability: number, probs: Record<string, number>): number {
  const entropy = calcEntropy(probs)
  return probability * (1 - entropy)
}

export function toConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score > 0.6) return 'high'
  if (score >= 0.4) return 'medium'
  return 'low'
}
