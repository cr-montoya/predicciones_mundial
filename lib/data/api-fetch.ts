const MAX_DAILY_REQUESTS = 95
const BACKOFF_MS = [1000, 2000, 4000]

let dailyRequestCount = 0
let countResetDate = new Date().toDateString()

function checkRateLimit(): void {
  const today = new Date().toDateString()
  if (today !== countResetDate) {
    dailyRequestCount = 0
    countResetDate = today
  }
  if (dailyRequestCount >= MAX_DAILY_REQUESTS) {
    throw new Error(`API daily limit reached (${MAX_DAILY_REQUESTS} requests). Try again tomorrow.`)
  }
}

function getEnvVars(): { host: string; key: string } {
  const key = process.env.RAPIDAPI_KEY
  const host = process.env.RAPIDAPI_HOST ?? 'api-football-v1.p.rapidapi.com'
  if (!key) {
    throw new Error('Missing required environment variable: RAPIDAPI_KEY')
  }
  return { host, key }
}

function buildUrl(host: string, endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`https://${host}/v3/${endpoint}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  return url.toString()
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  checkRateLimit()
  const { host, key } = getEnvVars()
  const url = buildUrl(host, endpoint, params)

  let lastError: Error = new Error('Unknown fetch error')

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_MS[attempt - 1])
    }

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': host,
        },
      })
    } catch (networkError) {
      lastError = networkError instanceof Error ? networkError : new Error(String(networkError))
      continue
    }

    if (response.status >= 500) {
      lastError = new Error(`API-Football returned ${response.status} on ${endpoint}`)
      continue
    }

    if (!response.ok) {
      throw new Error(`API-Football error ${response.status} on ${endpoint}`)
    }

    dailyRequestCount++
    return response.json() as Promise<T>
  }

  throw lastError
}
