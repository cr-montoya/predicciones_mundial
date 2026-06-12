import type { Fixture, FixtureStatus, MatchEvent, MatchEventType, MatchStats, Team } from '@/lib/types'
import type { DataProvider } from '@/lib/data/provider'
import { apiFetch } from '@/lib/data/api-fetch'
import { RateLimiter } from '@/lib/data/rate-limiter'

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

interface ApiFixtureItem {
  fixture: {
    id: number
    date: string
    status: { short: string }
  }
  teams: {
    home: { id: number }
    away: { id: number }
  }
  goals: {
    home: number | null
    away: number | null
  }
  league: { round: string }
}

interface ApiTeamStatsResponse {
  goals: {
    for: { average: { total: string } }
    against: { average: { total: string } }
  }
}

interface ApiEventItem {
  time: { elapsed: number }
  team: { id: number }
  player: { id: number | null }
  type: string
  detail: string
}

interface ApiStatItem {
  team: { id: number }
  statistics: Array<{ type: string; value: number | string | null }>
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeStatus(short: string): FixtureStatus {
  if (short === 'FT' || short === 'AET' || short === 'PEN') return 'finished'
  if (
    short === '1H' ||
    short === 'HT' ||
    short === '2H' ||
    short === 'ET' ||
    short === 'BT' ||
    short === 'P'
  ) return 'live'
  return 'scheduled'
}

function normalizeEventType(type: string, detail: string): MatchEventType | null {
  if (type === 'Goal') return 'goal'
  if (type === 'Card' && detail === 'Yellow Card') return 'yellow_card'
  if (type === 'Card' && (detail === 'Red Card' || detail === 'Second Yellow card')) return 'red_card'
  if (type === 'subst') return 'substitution'
  return null
}

function statValue(stats: ApiStatItem['statistics'], typeName: string): number | null {
  const entry = stats.find((s) => s.type === typeName)
  if (!entry || entry.value === null) return null
  return typeof entry.value === 'string' ? parseFloat(entry.value) : entry.value
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

function getEnvVars(): { host: string; key: string } {
  const key = process.env.API_KEY ?? process.env.RAPIDAPI_KEY
  const host = process.env.API_HOST ?? process.env.RAPIDAPI_HOST ?? 'api-football-v1.p.rapidapi.com'
  if (!key) {
    throw new Error('Missing required environment variable: API_KEY or RAPIDAPI_KEY')
  }
  return { host, key }
}

export class ApiFootballProvider implements DataProvider {
  readonly name = 'api-football'

  private readonly limiter: RateLimiter

  constructor(limiter?: RateLimiter) {
    this.limiter = limiter ?? new RateLimiter({ maxRequests: 95, windowType: 'daily' })
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const { host, key } = getEnvVars()
    const basePath = host.includes('v3') ? '' : '/v3'
    return apiFetch<T>(endpoint, {
      baseUrl: `https://${host}${basePath}`,
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host,
      },
      params,
      onBeforeRequest: () => this.limiter.check(),
      onAfterSuccess: () => this.limiter.record(),
    })
  }

  async fetchFixtures(leagueId: number, season: number): Promise<Fixture[]> {
    interface Resp { response: ApiFixtureItem[]; errors?: Record<string, string> }
    const data = await this.fetch<Resp>('fixtures', {
      league: String(leagueId),
      season: String(season),
    })

    console.log(
      `[api-football] fetchFixtures: ${data.response.length} fixtures for league ${leagueId} season ${season}`
    )

    return data.response.map((item) => ({
      id: item.fixture.id,
      homeTeamId: item.teams.home.id,
      awayTeamId: item.teams.away.id,
      kickoffUtc: item.fixture.date,
      status: normalizeStatus(item.fixture.status.short),
      homeGoals: item.goals.home,
      awayGoals: item.goals.away,
      round: item.league.round ?? null,
    }))
  }

  async fetchTeamStats(teamId: number, leagueId: number, season: number): Promise<Partial<Team>> {
    interface Resp { response: ApiTeamStatsResponse }
    const data = await this.fetch<Resp>('teams/statistics', {
      team: String(teamId),
      league: String(leagueId),
      season: String(season),
    })

    const r = data.response
    return {
      avgGoalsScored: parseFloat(r.goals.for.average.total) || null,
      avgGoalsConceded: parseFloat(r.goals.against.average.total) || null,
    }
  }

  async fetchMatchEvents(fixtureId: number): Promise<MatchEvent[]> {
    interface Resp { response: ApiEventItem[] }
    const data = await this.fetch<Resp>('fixtures/events', {
      fixture: String(fixtureId),
    })

    const events: MatchEvent[] = []
    let syntheticId = 1
    for (const item of data.response) {
      const type = normalizeEventType(item.type, item.detail)
      if (!type) continue
      events.push({
        id: syntheticId++,
        fixtureId,
        type,
        teamId: item.team.id,
        playerId: item.player.id ?? null,
        minute: item.time.elapsed,
      })
    }
    return events
  }

  async fetchMatchStats(fixtureId: number): Promise<MatchStats[]> {
    interface Resp { response: ApiStatItem[] }
    const data = await this.fetch<Resp>('fixtures/statistics', {
      fixture: String(fixtureId),
    })

    return data.response.map((item) => ({
      fixtureId,
      teamId: item.team.id,
      corners: statValue(item.statistics, 'Corner Kicks'),
      yellowCards: statValue(item.statistics, 'Yellow Cards'),
      redCards: statValue(item.statistics, 'Red Cards'),
      shotsOnTarget: statValue(item.statistics, 'Shots on Goal'),
      possession: statValue(item.statistics, 'Ball Possession'),
    }))
  }
}
