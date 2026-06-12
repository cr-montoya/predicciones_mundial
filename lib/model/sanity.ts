import type { ModelOutput } from '@/lib/types'

export function sanityCheckProbabilityBounds(output: ModelOutput): void {
  const entries = Object.entries(output.probabilities)
  if (entries.length === 0) return

  for (const [key, prob] of entries) {
    if (prob < 0 || prob > 1) {
      throw new Error(
        `sanityCheckProbabilityBounds failed for market ${output.market}: key "${key}" has probability ${prob} outside [0, 1]`
      )
    }
    if (prob === 0 || prob === 1) {
      throw new Error(
        `sanityCheckProbabilityBounds failed for market ${output.market}: key "${key}" has degenerate probability ${prob}`
      )
    }
  }
}
