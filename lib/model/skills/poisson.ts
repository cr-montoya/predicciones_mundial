function factorial(n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

function logFactorial(n: number): number {
  if (n <= 1) return 0
  let result = 0
  for (let i = 2; i <= n; i++) result += Math.log(i)
  return result
}

export function poissonPmf(k: number, lambda: number): number {
  if (k < 0) return 0
  if (lambda <= 0) return k === 0 ? 1 : 0

  if (k <= 20) {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)
  }

  const logProb = -lambda + k * Math.log(lambda) - logFactorial(k)
  return Math.exp(logProb)
}

export function poissonCdf(k: number, lambda: number): number {
  if (k < 0) return 0
  if (lambda <= 0) return 1

  let sum = 0
  for (let i = 0; i <= k; i++) {
    sum += poissonPmf(i, lambda)
  }
  return Math.min(sum, 1)
}
