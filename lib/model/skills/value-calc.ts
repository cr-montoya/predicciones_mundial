export const VALUE_THRESHOLD = 0.08

export interface ValueInput {
  modelProbability: number
  marketProbability: number
}

export interface ValueOutput {
  diff: number
  label: 'VALOR+' | 'VALOR-' | 'NEUTRO'
}

export function calcValue(input: ValueInput): ValueOutput {
  const diff = input.modelProbability - input.marketProbability

  let label: ValueOutput['label']
  if (diff >= VALUE_THRESHOLD) {
    label = 'VALOR+'
  } else if (diff <= -VALUE_THRESHOLD) {
    label = 'VALOR-'
  } else {
    label = 'NEUTRO'
  }

  return { diff, label }
}
