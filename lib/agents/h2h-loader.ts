import { apiFetch } from '@/lib/data/api-fetch'
import { DATA_REVALIDATE_SECONDS } from '@/lib/model/constants'
import type { H2HMatch } from '@/lib/types'

const FD_BASE_URL = 'https://api.football-data.org/v4'

function getApiKey(): string {
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) throw new Error('Missing required environment variable: FOOTBALLDATA_KEY')
  return key
}

interface FdH2HMatchItem {
  utcDate: string
  status: string
  stage: string
  homeTeam: { id: number; name: string }
  awayTeam: { id: number; name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}

interface FdH2HResponse {
  matches: FdH2HMatchItem[]
}

export async function loadH2H(teamAId: number, teamBId: number): Promise<H2HMatch[]> {
  try {
    const data = await apiFetch<FdH2HResponse>(
      `/teams/${teamAId}/matches`,
      {
        baseUrl: FD_BASE_URL,
        headers: { 'X-Auth-Token': getApiKey() },
        params: { competitions: 'WC' },
        timeoutMs: 2000,
        revalidate: DATA_REVALIDATE_SECONDS,
      }
    )
    return (data.matches ?? [])
      .filter(
        (m) =>
          m.status === 'FINISHED' &&
          m.score.fullTime.home !== null &&
          m.score.fullTime.away !== null &&
          (m.homeTeam.id === teamBId || m.awayTeam.id === teamBId)
      )
      .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
      .slice(0, 5)
      .map((m) => ({
        date: m.utcDate.slice(0, 10),
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        homeGoals: m.score.fullTime.home!,
        awayGoals: m.score.fullTime.away!,
        stage: m.stage,
      }))
  } catch {
    return []
  }
}
