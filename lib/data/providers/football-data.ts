import type { Fixture, FixtureStatus, MatchEvent, MatchEventType, MatchStats, Team } from '@/lib/types'
import type { DataProvider } from '@/lib/data/provider'
import { apiFetch } from '@/lib/data/api-fetch'
import { RateLimiter } from '@/lib/data/rate-limiter'

// ---------------------------------------------------------------------------
// Canonical ID mapping: football-data team ID -> canonical (RapidAPI) team ID
// Only a few example entries; extend as needed.
// ---------------------------------------------------------------------------

const FD_TEAM_MAP: Record<number, number> = {
  758: 7,     // Uruguay
  759: 25,    // Germany
  760: 9,     // Spain
  761: 14,    // Paraguay
  762: 26,    // Argentina
  763: 135,   // Ghana
  764: 6,     // Brazil
  765: 10,    // Portugal
  766: 21,    // Japan
  769: 16,    // Mexico
  770: 24,    // England
  771: 1,     // United States
  772: 28,    // South Korea
  773: 2,     // France
  774: 56,    // South Africa
  778: 46,    // Algeria
  779: 35,    // Australia
  783: 30,    // New Zealand
  788: 15,    // Switzerland
  791: 128,   // Ecuador
  792: 17,    // Sweden
  798: 63,    // Czechia
  799: 3,     // Croatia
  801: 34,    // Saudi Arabia
  802: 33,    // Tunisia
  803: 141,   // Turkey
  804: 51,    // Senegal
  805: 4,     // Belgium
  815: 32,    // Morocco
  816: 41,    // Austria
  818: 20,    // Colombia
  825: 37,    // Egypt
  828: 101,   // Canada
  836: 168,   // Haiti
  840: 31,    // Iran
  1060: 92,   // Bosnia-Herzegovina
  1836: 22,   // Panama
  1930: 206,  // Cape Verde Islands
  1934: 69,   // Congo DR
  1935: 39,   // Ivory Coast
  8030: 197,  // Qatar
  8049: 172,  // Jordan
  8062: 173,  // Iraq
  8070: 90,   // Uzbekistan
  8601: 5,    // Netherlands
  8872: 119,  // Norway
  8873: 1179, // Scotland
  9460: 617,  // Curaçao
}

function toCanonicalTeamId(fdId: number): number {
  return FD_TEAM_MAP[fdId] ?? fdId
}

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
