import type { Fixture, FixtureStatus, MatchEvent, MatchEventType, MatchStats, Team } from '@/lib/types'
import type { DataProvider } from '@/lib/data/provider'
import { apiFetch } from '@/lib/data/api-fetch'
import { RateLimiter } from '@/lib/data/rate-limiter'
import { DATA_REVALIDATE_SECONDS } from '@/lib/model/constants'
import { toCanonicalTeamId } from '@/lib/data/fd-team-map'

// ---------------------------------------------------------------------------
// Response shapes (football-data.org v4)
// ---------------------------------------------------------------------------

type FdMatchStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'SUSPENDED' | 'AWARDED'

interface FdScore {
  home: number | null
  away: number | null
}

interface FdMatchItem {
  id: number
  utcDate: string
  status: FdMatchStatus
  matchday: number | null
  stage: string
  homeTeam: { id: number }
  awayTeam: { id: number }
  score: {
    fullTime: FdScore
  }
}

interface FdMatchesResponse {
  matches: FdMatchItem[]
}

interface FdTeamStats {
  /** football-data does not expose per-team averages; this is a stub shape. */
  id: number
  name: string
}

interface FdGoalItem {
  minute: number
  team: { id: number } | null
  scorer: { id: number | null } | null
  type: string
}

interface FdBookingItem {
  minute: number
  team: { id: number } | null
  player: { id: number | null } | null
  card: 'YELLOW' | 'YELLOW_RED' | 'RED'
}

interface FdSubstitutionItem {
  minute: number
  team: { id: number } | null
  playerOut: { id: number | null } | null
}

interface FdMatchDetail {
  id: number
  status: FdMatchStatus
  homeTeam: { id: number }
  awayTeam: { id: number }
  goals: FdGoalItem[]
  bookings: FdBookingItem[]
  substitutions: FdSubstitutionItem[]
  statistics?: FdTeamStatBlock[]
}

interface FdTeamStatBlock {
  team: { id: number }
  statistics: {
    corners: number | null
    yellowCards: number | null
    redCards: number | null
    shotsOnGoal: number | null
    ballPossession: number | null
  }
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeStatus(status: FdMatchStatus): FixtureStatus {
  if (status === 'FINISHED' || status === 'AWARDED') return 'finished'
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'live'
  return 'scheduled'
}

function normalizeRound(stage: string, matchday: number | null): string | null {
  if (matchday !== null) return `Group Stage - Matchday ${matchday}`
  return stage ?? null
}

function normalizeBookingType(card: FdBookingItem['card']): MatchEventType {
  if (card === 'YELLOW') return 'yellow_card'
  return 'red_card'
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) {
    throw new Error('Missing required environment variable: FOOTBALLDATA_KEY')
  }
  return key
}

const FD_BASE_URL = 'https://api.football-data.org/v4'

export class FootballDataProvider implements DataProvider {
  readonly name = 'football-data'

  private readonly limiter: RateLimiter

  constructor(limiter?: RateLimiter) {
    this.limiter = limiter ?? new RateLimiter({
      maxRequests: 10,
      windowType: 'sliding',
      windowMs: 60_000,
    })
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const key = getApiKey()
    return apiFetch<T>(endpoint, {
      baseUrl: FD_BASE_URL,
      headers: { 'X-Auth-Token': key },
      params,
      revalidate: DATA_REVALIDATE_SECONDS,
      onBeforeRequest: () => this.limiter.check(),
      onAfterSuccess: () => this.limiter.record(),
    })
  }

  async fetchFixtures(leagueId: number, season: number): Promise<Fixture[]> {
    const competitionId = leagueId === 1 ? 'WC' : String(leagueId)
    let endpoint: string
    let params: Record<string, string>

    if (leagueId === 1) {
      endpoint = `competitions/${competitionId}/matches`
      params = { season: String(season), limit: '100' }
    } else {
      endpoint = 'matches'
      params = { competitions: competitionId, season: String(season) }
    }

    const data = await this.fetch<FdMatchesResponse>(endpoint, params)

    // Filter out fixtures with TBD teams (homeTeam or awayTeam null/TBD)
    const validMatches = data.matches.filter(
      (item) => item.homeTeam?.id != null && item.awayTeam?.id != null
    )

    console.log(
      `[football-data] fetchFixtures: ${validMatches.length} valid matches (filtered from ${data.matches.length} total) for competition ${competitionId} season ${season}`
    )

    return validMatches.map((item) => ({
      id: item.id,
      homeTeamId: toCanonicalTeamId(item.homeTeam.id),
      awayTeamId: toCanonicalTeamId(item.awayTeam.id),
      kickoffUtc: item.utcDate,
      status: normalizeStatus(item.status),
      homeGoals: item.score.fullTime.home,
      awayGoals: item.score.fullTime.away,
      round: normalizeRound(item.stage, item.matchday),
    }))
  }

  async fetchTeamStats(teamId: number, _leagueId: number, _season: number): Promise<Partial<Team>> {
    // football-data.org does not expose per-team goal averages in a dedicated
    // stats endpoint for free tier. We fetch the team resource to confirm it
    // exists and return empty partials; the fallback chain will use mock data.
    await this.fetch<FdTeamStats>(`teams/${teamId}`)
    return {}
  }

  async fetchMatchEvents(fixtureId: number): Promise<MatchEvent[]> {
    const data = await this.fetch<FdMatchDetail>(`matches/${fixtureId}`)

    const events: MatchEvent[] = []
    let syntheticId = 1

    for (const g of data.goals ?? []) {
      if (!g.team) continue
      events.push({
        id: syntheticId++,
        fixtureId,
        type: 'goal',
        teamId: toCanonicalTeamId(g.team.id),
        playerId: g.scorer?.id ?? null,
        minute: g.minute,
      })
    }

    for (const b of data.bookings ?? []) {
      if (!b.team) continue
      events.push({
        id: syntheticId++,
        fixtureId,
        type: normalizeBookingType(b.card),
        teamId: toCanonicalTeamId(b.team.id),
        playerId: b.player?.id ?? null,
        minute: b.minute,
      })
    }

    for (const s of data.substitutions ?? []) {
      if (!s.team) continue
      events.push({
        id: syntheticId++,
        fixtureId,
        type: 'substitution',
        teamId: toCanonicalTeamId(s.team.id),
        playerId: s.playerOut?.id ?? null,
        minute: s.minute,
      })
    }

    return events
  }

  async fetchMatchStats(fixtureId: number): Promise<MatchStats[]> {
    const data = await this.fetch<FdMatchDetail>(`matches/${fixtureId}`)

    if (!data.statistics || data.statistics.length === 0) {
      return []
    }

    return data.statistics.map((block) => ({
      fixtureId,
      teamId: toCanonicalTeamId(block.team.id),
      corners: block.statistics.corners ?? null,
      yellowCards: block.statistics.yellowCards ?? null,
      redCards: block.statistics.redCards ?? null,
      shotsOnTarget: block.statistics.shotsOnGoal ?? null,
      possession: block.statistics.ballPossession ?? null,
    }))
  }
}
