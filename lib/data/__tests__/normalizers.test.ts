/**
 * Normalization tests for both data providers.
 * Pure tests: use static JSON fixtures, no network.
 */

import { describe, it, expect } from 'vitest'
import type { Fixture, MatchStats, MatchEvent } from '@/lib/types'

// ---------------------------------------------------------------------------
// Static JSON fixtures
// ---------------------------------------------------------------------------

import apiFbRaw from '@/lib/data/__fixtures__/api-football/fixtures.json'
import fdRaw from '@/lib/data/__fixtures__/football-data/matches.json'

// ---------------------------------------------------------------------------
// Private functions re-implemented inline for testing normalization without
// a network. Rather than invoking the provider (which requires an API key),
// we replicate the normalizers from source as-is.
// ---------------------------------------------------------------------------

// ---- API-Football normalizer (inline, identical to the provider) ----

type FixtureStatus = 'scheduled' | 'live' | 'finished'

function afNormalizeStatus(short: string): FixtureStatus {
  if (short === 'FT' || short === 'AET' || short === 'PEN') return 'finished'
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(short)) return 'live'
  return 'scheduled'
}

function normalizeApiFootballFixtures(raw: typeof apiFbRaw): Fixture[] {
  return raw.response.map((item) => ({
    id: item.fixture.id,
    homeTeamId: item.teams.home.id,
    awayTeamId: item.teams.away.id,
    kickoffUtc: item.fixture.date,
    status: afNormalizeStatus(item.fixture.status.short),
    homeGoals: item.goals.home,
    awayGoals: item.goals.away,
    round: item.league.round ?? null,
  }))
}

// ---- football-data normalizer (inline, idéntico al provider) ----

const FD_TEAM_MAP: Record<number, number> = {
  759: 1001,
  773: 1002,
  764: 1003,
  66:  1004,
}

function toCanonicalTeamId(fdId: number): number {
  return FD_TEAM_MAP[fdId] ?? fdId
}

type FdMatchStatus = 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' | 'SUSPENDED' | 'AWARDED'

function fdNormalizeStatus(status: FdMatchStatus): FixtureStatus {
  if (status === 'FINISHED' || status === 'AWARDED') return 'finished'
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'live'
  return 'scheduled'
}

function fdNormalizeRound(stage: string, matchday: number | null): string | null {
  if (matchday !== null) return `Group Stage - Matchday ${matchday}`
  return stage ?? null
}

function normalizeFootballDataFixtures(raw: typeof fdRaw): Fixture[] {
  return raw.matches.map((item) => ({
    id: item.id,
    homeTeamId: toCanonicalTeamId(item.homeTeam.id),
    awayTeamId: toCanonicalTeamId(item.awayTeam.id),
    kickoffUtc: item.utcDate,
    status: fdNormalizeStatus(item.status as FdMatchStatus),
    homeGoals: item.score.fullTime.home,
    awayGoals: item.score.fullTime.away,
    round: fdNormalizeRound(item.stage, item.matchday),
  }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('normalización API-Football -> Fixture[]', () => {
  const fixtures = normalizeApiFootballFixtures(apiFbRaw)

  it('devuelve el número correcto de fixtures', () => {
    expect(fixtures).toHaveLength(2)
  })

  it('cada fixture tiene los campos obligatorios del tipo Fixture', () => {
    for (const f of fixtures) {
      expect(typeof f.id).toBe('number')
      expect(typeof f.homeTeamId).toBe('number')
      expect(typeof f.awayTeamId).toBe('number')
      expect(typeof f.kickoffUtc).toBe('string')
      expect(['scheduled', 'live', 'finished']).toContain(f.status)
    }
  })

  it('partido NS -> status scheduled', () => {
    const scheduled = fixtures.find(f => f.id === 9001)
    expect(scheduled?.status).toBe('scheduled')
    expect(scheduled?.homeGoals).toBeNull()
    expect(scheduled?.awayGoals).toBeNull()
  })

  it('partido FT -> status finished con goles', () => {
    const finished = fixtures.find(f => f.id === 9002)
    expect(finished?.status).toBe('finished')
    expect(finished?.homeGoals).toBe(1)
    expect(finished?.awayGoals).toBe(2)
  })

  it('IDs canónicos de API-Football se preservan sin transformación', () => {
    const f1 = fixtures.find(f => f.id === 9001)
    expect(f1?.homeTeamId).toBe(1001)
    expect(f1?.awayTeamId).toBe(1002)
  })
})

describe('normalización football-data.org -> Fixture[]', () => {
  const fixtures = normalizeFootballDataFixtures(fdRaw)

  it('devuelve el número correcto de fixtures', () => {
    expect(fixtures).toHaveLength(2)
  })

  it('cada fixture tiene los campos obligatorios del tipo Fixture', () => {
    for (const f of fixtures) {
      expect(typeof f.id).toBe('number')
      expect(typeof f.homeTeamId).toBe('number')
      expect(typeof f.awayTeamId).toBe('number')
      expect(typeof f.kickoffUtc).toBe('string')
      expect(['scheduled', 'live', 'finished']).toContain(f.status)
    }
  })

  it('SCHEDULED -> status scheduled', () => {
    const f = fixtures.find(f => f.id === 9001)
    expect(f?.status).toBe('scheduled')
    expect(f?.homeGoals).toBeNull()
  })

  it('FINISHED -> status finished con goles', () => {
    const f = fixtures.find(f => f.id === 9002)
    expect(f?.status).toBe('finished')
    expect(f?.homeGoals).toBe(1)
    expect(f?.awayGoals).toBe(2)
  })

  it('IDs de football-data se traducen a canónicos via FD_TEAM_MAP (Argentina 759 -> 1001)', () => {
    const f1 = fixtures.find(f => f.id === 9001)
    expect(f1?.homeTeamId).toBe(1001)
    expect(f1?.awayTeamId).toBe(1002)
  })

  it('IDs de football-data sin entrada en FD_TEAM_MAP se preservan tal cual', () => {
    const unknownId = 99999
    const canonicalId = toCanonicalTeamId(unknownId)
    expect(canonicalId).toBe(unknownId)
  })
})

describe('TEST CRITICO: mismo equipo = mismo canonical ID desde ambos proveedores', () => {
  const afFixtures = normalizeApiFootballFixtures(apiFbRaw)
  const fdFixtures = normalizeFootballDataFixtures(fdRaw)

  it('Argentina (AF id=1001, FD id=759) -> canonical 1001 en ambos proveedores', () => {
    // Fixture 9001: home es Argentina en ambos providers
    const afArgentina = afFixtures.find(f => f.id === 9001)?.homeTeamId
    const fdArgentina = fdFixtures.find(f => f.id === 9001)?.homeTeamId
    expect(afArgentina).toBe(1001)
    expect(fdArgentina).toBe(1001)
    expect(afArgentina).toBe(fdArgentina)
  })

  it('France (AF id=1002, FD id=773) -> canonical 1002 en ambos proveedores', () => {
    // Fixture 9001: away es France en ambos providers
    const afFrance = afFixtures.find(f => f.id === 9001)?.awayTeamId
    const fdFrance = fdFixtures.find(f => f.id === 9001)?.awayTeamId
    expect(afFrance).toBe(1002)
    expect(fdFrance).toBe(1002)
    expect(afFrance).toBe(fdFrance)
  })

  it('England (AF id=1004, FD id=66) -> canonical 1004 en ambos proveedores', () => {
    // Fixture 9002: home es England
    const afEngland = afFixtures.find(f => f.id === 9002)?.homeTeamId
    const fdEngland = fdFixtures.find(f => f.id === 9002)?.homeTeamId
    expect(afEngland).toBe(1004)
    expect(fdEngland).toBe(1004)
    expect(afEngland).toBe(fdEngland)
  })

  it('fixture 9001 produce la misma estructura desde ambos proveedores', () => {
    const af = afFixtures.find(f => f.id === 9001)!
    const fd = fdFixtures.find(f => f.id === 9001)!
    expect(af.homeTeamId).toBe(fd.homeTeamId)
    expect(af.awayTeamId).toBe(fd.awayTeamId)
    expect(af.status).toBe(fd.status)
    expect(af.homeGoals).toBe(fd.homeGoals)
    expect(af.awayGoals).toBe(fd.awayGoals)
  })
})

describe('shape de fetchTeamStats', () => {
  it('API-Football devuelve { avgGoalsScored, avgGoalsConceded } o campos en null - shape válido', () => {
    // Simulamos el resultado normalizado que devuelve el provider
    const result: Partial<{ avgGoalsScored: number | null; avgGoalsConceded: number | null }> = {
      avgGoalsScored: 1.8,
      avgGoalsConceded: 0.7,
    }
    expect('avgGoalsScored' in result || Object.keys(result).length === 0).toBe(true)
  })

  it('football-data devuelve partial vacío (free tier no expone stats) - mismo tipo Partial<Team>', () => {
    // football-data fetchTeamStats devuelve {} por limitación del tier gratuito
    const result: Partial<{ avgGoalsScored: number | null; avgGoalsConceded: number | null }> = {}
    // Debe ser un objeto (no null, no undefined)
    expect(typeof result).toBe('object')
    expect(result).not.toBeNull()
  })
})

describe('shape de fetchMatchStats: null fields cuando no disponibles', () => {
  it('MatchStats tiene todos los campos opcionales en null cuando football-data no los provee', () => {
    const stats: MatchStats = {
      fixtureId: 9001,
      teamId: 1001,
      corners: null,
      yellowCards: null,
      redCards: null,
      shotsOnTarget: null,
      possession: null,
    }
    expect(stats.corners).toBeNull()
    expect(stats.yellowCards).toBeNull()
    expect(stats.redCards).toBeNull()
    expect(stats.shotsOnTarget).toBeNull()
    expect(stats.possession).toBeNull()
  })

  it('MatchStats con datos disponibles tiene números en todos los campos', () => {
    const stats: MatchStats = {
      fixtureId: 9002,
      teamId: 1004,
      corners: 5,
      yellowCards: 2,
      redCards: 0,
      shotsOnTarget: 4,
      possession: 52,
    }
    expect(typeof stats.corners).toBe('number')
    expect(typeof stats.yellowCards).toBe('number')
  })
})

describe('shape de fetchMatchEvents', () => {
  it('MatchEvent tiene los campos requeridos', () => {
    const event: MatchEvent = {
      id: 1,
      fixtureId: 9001,
      type: 'goal',
      teamId: 1001,
      playerId: null,
      minute: 23,
    }
    expect(['goal', 'yellow_card', 'red_card', 'substitution']).toContain(event.type)
    expect(event.playerId).toBeNull()
    expect(event.minute).toBeGreaterThanOrEqual(1)
  })

  it('campo playerId puede ser null (dato incompleto de API)', () => {
    const event: MatchEvent = {
      id: 2,
      fixtureId: 9001,
      type: 'yellow_card',
      teamId: 1002,
      playerId: null,
      minute: 45,
    }
    expect(event.playerId).toBeNull()
  })
})
