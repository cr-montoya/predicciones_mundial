const BACKOFF_MS = [1000, 2000, 4000]

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildUrl(baseUrl: string, endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${endpoint}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  return url.toString()
}

export interface ApiFetchOptions {
  baseUrl: string
  headers?: Record<string, string>
  params?: Record<string, string>
  /** Called before each request attempt. Should throw if quota is exhausted. */
  onBeforeRequest?: () => void
  /** Called after each successful response to update internal counters. */
  onAfterSuccess?: () => void
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions): Promise<T> {
  const { baseUrl, headers = {}, params, onBeforeRequest, onAfterSuccess } = options

  onBeforeRequest?.()

  const url = buildUrl(baseUrl, endpoint, params)
  console.log(`[apiFetch] Calling ${url}`)

  let lastError: Error = new Error('Unknown fetch error')

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      console.log(`[apiFetch] Retry attempt ${attempt} after ${BACKOFF_MS[attempt - 1]}ms`)
      await sleep(BACKOFF_MS[attempt - 1])
    }

    let response: Response
    try {
      response = await fetch(url, { headers })
    } catch (networkError) {
      lastError = networkError instanceof Error ? networkError : new Error(String(networkError))
      console.error(`[apiFetch] Network error: ${lastError.message}`)
      continue
    }

    console.log(`[apiFetch] Response status: ${response.status}`)

    if (response.status >= 500) {
      lastError = new Error(`HTTP ${response.status} on ${endpoint}`)
      console.warn(`[apiFetch] Server error, will retry: ${lastError.message}`)
      continue
    }

    if (!response.ok) {
      const text = await response.text()
      console.error(`[apiFetch] HTTP error ${response.status}. Response: ${text.slice(0, 500)}`)
      throw new Error(`HTTP error ${response.status} on ${endpoint}`)
    }

    onAfterSuccess?.()
    const data = await response.json() as T
    console.log(`[apiFetch] Success (status ${response.status})`)
    return data
  }

  throw lastError
}
