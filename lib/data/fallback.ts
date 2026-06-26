import type { Fixture, MatchEvent, MatchStats, Team } from '@/lib/types'
import type { DataProvider } from './provider'
import { ApiFootballProvider } from './providers/api-football'
import { FootballDataProvider } from './providers/football-data'
import {
  mockFixtures,
  mockTeams,
  mockMatchEvents,
  mockMatchStats,
} from './fixtures-mock'

// ---------------------------------------------------------------------------
// Mock provider (last resort)
// ---------------------------------------------------------------------------

const mockProvider: DataProvider = {
  name: 'mock',

  async fetchFixtures(_leagueId: number, _season: number): Promise<Fixture[]> {
    return mockFixtures
  },

  async fetchTeamStats(teamId: number, _leagueId: number, _season: number): Promise<Partial<Team>> {
    const team = mockTeams.find((t) => t.id === teamId)
    if (!team) return {}
    return {
      avgGoalsScored: team.avgGoalsScored,
      avgGoalsConceded: team.avgGoalsConceded,
    }
  },

  async fetchMatchEvents(fixtureId: number): Promise<MatchEvent[]> {
    return mockMatchEvents[fixtureId] ?? []
  },

  async fetchMatchStats(fixtureId: number): Promise<MatchStats[]> {
    return mockMatchStats[fixtureId] ?? []
  },
}

// ---------------------------------------------------------------------------
// Default provider chain
// ---------------------------------------------------------------------------

// football-data.org is the primary source; API-Football is the fallback
// (its RapidAPI key is not active) and mock is the last resort.
const defaultProviders: DataProvider[] = [
  new FootballDataProvider(),
  new ApiFootballProvider(),
  mockProvider,
]

// ---------------------------------------------------------------------------
// Fallback orchestrator
// ---------------------------------------------------------------------------

async function withFallback<T>(
  providers: DataProvider[],
  label: string,
  call: (p: DataProvider) => Promise<T[]>,
  isEmpty: (result: T[]) => boolean = (r) => r.length === 0
): Promise<T[]> {
  for (const provider of providers) {
    try {
      const result = await call(provider)
      if (!isEmpty(result)) {
        console.log(`[fallback] ${label}: served by "${provider.name}"`)
        return result
      }
      console.log(`[fallback] ${label}: "${provider.name}" returned empty, trying next`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`[fallback] ${label}: "${provider.name}" failed (${msg}), trying next`)
    }
  }

  // All providers exhausted — return the last provider's result (mock).
  const last = providers[providers.length - 1]
  console.log(`[fallback] ${label}: all providers exhausted, using "${last.name}"`)
  return call(last)
}

async function withFallbackPartial<T extends object>(
  providers: DataProvider[],
  label: string,
  call: (p: DataProvider) => Promise<Partial<T>>,
  isEmpty: (result: Partial<T>) => boolean = (r) => Object.keys(r).length === 0
): Promise<Partial<T>> {
  for (const provider of providers) {
    try {
      const result = await call(provider)
      if (!isEmpty(result)) {
        console.log(`[fallback] ${label}: served by "${provider.name}"`)
        return result
      }
      console.log(`[fallback] ${label}: "${provider.name}" returned empty partial, trying next`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`[fallback] ${label}: "${provider.name}" failed (${msg}), trying next`)
    }
  }

  const last = providers[providers.length - 1]
  console.log(`[fallback] ${label}: all providers exhausted, using "${last.name}"`)
  return call(last)
}

// ---------------------------------------------------------------------------
// Public API — mirrors the original api-football.ts surface
// ---------------------------------------------------------------------------

export async function fetchFixtures(
  leagueId: number,
  season: number,
  providers: DataProvider[] = defaultProviders
): Promise<Fixture[]> {
  return withFallback(
    providers,
    `fetchFixtures(${leagueId},${season})`,
    (p) => p.fetchFixtures(leagueId, season)
  )
}

export async function fetchTeamStats(
  teamId: number,
  leagueId: number,
  season: number,
  providers: DataProvider[] = defaultProviders
): Promise<Partial<Team>> {
  return withFallbackPartial(
    providers,
    `fetchTeamStats(${teamId})`,
    (p) => p.fetchTeamStats(teamId, leagueId, season)
  )
}

export async function fetchMatchEvents(
  fixtureId: number,
  providers: DataProvider[] = defaultProviders
): Promise<MatchEvent[]> {
  return withFallback(
    providers,
    `fetchMatchEvents(${fixtureId})`,
    (p) => p.fetchMatchEvents(fixtureId)
  )
}

export async function fetchMatchStats(
  fixtureId: number,
  providers: DataProvider[] = defaultProviders
): Promise<MatchStats[]> {
  return withFallback(
    providers,
    `fetchMatchStats(${fixtureId})`,
    (p) => p.fetchMatchStats(fixtureId)
  )
}
